import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, supabase } from '@/lib/db';
import { NotificationTemplates } from '@/lib/notifications';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser || sessionUser.role !== 'leader') {
      return NextResponse.json({ error: 'Only team leaders can upload deliverables' }, { status: 403 });
    }

    const team = await db.getTeamByLeaderId(sessionUser.id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const formData = await req.formData();
    const docType = formData.get('type') as 'report' | 'paper'; // 'report' or 'paper'
    const file = formData.get('file') as File;

    if (!docType || !file) {
      return NextResponse.json({ error: 'Document type and file are required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || '.pdf';
    const filename = `${team.team_code}_${docType}_${Date.now()}${ext}`;

    let publicUrl = '';

    // Attempt Supabase Storage upload
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .upload(filename, buffer, {
          contentType: file.type || 'application/pdf',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('project-documents')
          .getPublicUrl(filename);
        publicUrl = urlData.publicUrl;
      }
    } catch (sErr) {
      console.warn('Supabase storage upload fallback to local filesystem:', sErr);
    }

    // Local filesystem storage fallback
    if (!publicUrl) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const localFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(localFilePath, buffer);
      publicUrl = `/uploads/${filename}`;
    }

    // Update team document record
    const updates: any = { report_uploaded_at: new Date().toISOString() };
    if (docType === 'report') updates.report_url = publicUrl;
    if (docType === 'paper') updates.paper_url = publicUrl;

    await db.updateTeam(team.id, updates);

    // Notify Supervisor (Category C)
    if (team.supervisor_id) {
      const supervisor = await db.getUserById(team.supervisor_id);
      if (supervisor) {
        const notif = NotificationTemplates.documentSubmission({
          facultyUserId: supervisor.id,
          teamName: team.team_name,
          leaderName: sessionUser.full_name,
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        });
        await db.createNotification(notif);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${docType === 'report' ? 'Final Project Report' : 'Research Paper'} uploaded successfully.`,
      url: publicUrl,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
