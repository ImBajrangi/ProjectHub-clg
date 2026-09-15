import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function GET(req: NextRequest) {
  try {
    const { data: dbRooms, error: roomsError } = await db.supabase
      .from('presentation_rooms')
      .select('id, name, building, created_at')
      .order('name', { ascending: true });

    const { data: dbShifts, error: shiftsError } = await db.supabase
      .from('presentation_shifts')
      .select('id, label, time_window, time_short, icon, color, color_bg, color_border, sort_order, created_at')
      .order('sort_order', { ascending: true });

    let finalRooms: string[] = [];
    let rawRooms: any[] = [];
    if (!roomsError && Array.isArray(dbRooms)) {
      rawRooms = dbRooms;
      finalRooms = dbRooms.map((r: any) => r.name);
    }

    let finalShifts: any[] = [];
    if (!shiftsError && Array.isArray(dbShifts)) {
      finalShifts = dbShifts.map((s: any) => ({
        id: s.id,
        label: s.label,
        timeWindow: s.time_window,
        timeShort: s.time_short,
        icon: s.icon || 'clock',
        color: s.color || '#2563EB',
        colorBg: s.color_bg || '#EFF6FF',
        colorBorder: s.color_border || '#BFDBFE',
        sort_order: s.sort_order || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      rooms: finalRooms,
      rawRooms,
      shifts: finalShifts,
      isRealTable: !roomsError && !shiftsError,
    });
  } catch (error: any) {
    console.error('Error fetching rooms and shifts:', error);
    return NextResponse.json({
      success: true,
      rooms: [],
      rawRooms: [],
      shifts: [],
      fallback: true,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('codeshastra_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sessionUser = await auth.validateSession(token);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // --- ROOM ACTIONS ---
    if (action === 'add_room') {
      const { name, building = 'Academic Block AB10' } = body;
      const cleanName = (name || '').trim();
      if (!cleanName) {
        return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
      }

      const { data, error } = await db.supabase
        .from('presentation_rooms')
        .insert([{ name: cleanName, building }])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, room: data });
    }

    if (action === 'edit_room') {
      const { id, oldName, newName, building } = body;
      const cleanNewName = (newName || '').trim();
      if (!cleanNewName) {
        return NextResponse.json({ error: 'New room name is required' }, { status: 400 });
      }

      let query = db.supabase.from('presentation_rooms').update({ name: cleanNewName, ...(building ? { building } : {}) });
      if (id && isUuid(id)) {
        query = query.eq('id', id);
      } else if (oldName) {
        query = query.eq('name', oldName);
      } else {
        return NextResponse.json({ error: 'Room ID or Old Name is required' }, { status: 400 });
      }

      const { data, error } = await query.select();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // If old room name exists, also update any panel records that were using it
      if (oldName && oldName !== cleanNewName) {
        await db.supabase.from('panels').update({ room_number: cleanNewName }).eq('room_number', oldName);
        db.invalidateStore();
      }

      return NextResponse.json({ success: true, room: data });
    }

    if (action === 'delete_room') {
      const { id, name } = body;
      let query = db.supabase.from('presentation_rooms').delete();
      if (id && isUuid(id)) {
        query = query.eq('id', id);
      } else if (name) {
        query = query.ilike('name', name.trim());
      } else {
        return NextResponse.json({ success: true, message: 'Local room cleared' });
      }

      const { error } = await query;
      if (error) {
        console.warn('Delete room warning in Supabase:', error.message);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'clear_all_rooms') {
      const { error } = await db.supabase.from('presentation_rooms').delete().neq('name', '___NON_EXISTENT___');
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'All rooms cleared' });
    }

    // --- SHIFT ACTIONS ---
    if (action === 'add_shift') {
      const { label, timeWindow, timeShort, icon = 'clock', color = '#2563EB', colorBg = '#EFF6FF', colorBorder = '#BFDBFE', sortOrder = 99 } = body;
      if (!label || !timeWindow || !timeShort) {
        return NextResponse.json({ error: 'Label, Time Window, and Short Timing are required' }, { status: 400 });
      }

      const { data, error } = await db.supabase
        .from('presentation_shifts')
        .insert([{
          label: label.trim(),
          time_window: timeWindow.trim(),
          time_short: timeShort.trim(),
          icon,
          color,
          color_bg: colorBg,
          color_border: colorBorder,
          sort_order: sortOrder,
        }])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, shift: data });
    }

    if (action === 'edit_shift') {
      const { id, label, timeWindow, timeShort, icon, color, colorBg, colorBorder, sortOrder } = body;
      if (!id && !label) {
        return NextResponse.json({ error: 'Shift ID or label is required' }, { status: 400 });
      }

      const shiftData: any = {
        label: label ? label.trim() : undefined,
        time_window: timeWindow ? timeWindow.trim() : undefined,
        time_short: timeShort ? timeShort.trim() : undefined,
        icon: icon !== undefined ? icon : undefined,
        color: color !== undefined ? color : undefined,
        color_bg: colorBg !== undefined ? colorBg : undefined,
        color_border: colorBorder !== undefined ? colorBorder : undefined,
        sort_order: sortOrder !== undefined ? sortOrder : undefined,
      };
      Object.keys(shiftData).forEach((k) => shiftData[k] === undefined && delete shiftData[k]);

      if (id && isUuid(id)) {
        const { data, error } = await db.supabase
          .from('presentation_shifts')
          .update(shiftData)
          .eq('id', id)
          .select();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, shift: data });
      } else {
        // If editing a preset that wasn't in DB yet, insert it cleanly
        const { data, error } = await db.supabase
          .from('presentation_shifts')
          .insert([{
            label: label?.trim() || 'Custom Shift',
            time_window: timeWindow?.trim() || 'Custom Batch',
            time_short: timeShort?.trim() || '08:00 AM - 10:00 AM',
            icon: icon || 'clock',
            color: color || '#2563EB',
            color_bg: colorBg || '#EFF6FF',
            color_border: colorBorder || '#BFDBFE',
            sort_order: sortOrder || 0,
          }])
          .select()
          .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, shift: data });
      }
    }

    if (action === 'delete_shift') {
      const { id, label, timeWindow } = body;
      if (!id && !label) {
        return NextResponse.json({ error: 'Shift ID or Label is required' }, { status: 400 });
      }

      let query = db.supabase.from('presentation_shifts').delete();
      if (id && isUuid(id)) {
        query = query.eq('id', id);
      } else if (label) {
        query = query.ilike('label', label.trim());
      } else if (timeWindow) {
        query = query.ilike('time_window', timeWindow.trim());
      } else {
        return NextResponse.json({ success: true, message: 'Local preset cleared' });
      }

      const { error } = await query;
      if (error) {
        console.warn('Delete shift warning in Supabase:', error.message);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'clear_all_shifts') {
      const { error } = await db.supabase.from('presentation_shifts').delete().neq('label', '___NON_EXISTENT___');
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'All shifts cleared' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Rooms/Shifts API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
