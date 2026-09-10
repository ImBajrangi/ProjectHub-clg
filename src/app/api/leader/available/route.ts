import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Return students belonging to this team
      const students = await db.getStudentsByTeam(teamId);
      return NextResponse.json({
        students: students.map((s) => ({
          id: s.id,
          roll_no: s.roll_no,
          full_name: s.full_name,
          email: s.email,
          mobile: s.mobile,
          course: s.course,
          section: s.section,
        })),
      });
    }

    // Return available teams that do not have an assigned leader
    const availableTeams = await db.getAvailableTeamsForLeader();
    return NextResponse.json({ teams: availableTeams });
  } catch (error) {
    console.error('Available teams error:', error);
    return NextResponse.json({ error: 'Failed to fetch available teams' }, { status: 500 });
  }
}
