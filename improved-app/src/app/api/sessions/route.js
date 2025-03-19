// API route handlers for sessions
import { createSession, getSessionById, getSessions, getSessionTransactions, addProductToSession, completeSession, cancelSession } from '@/lib/sessions';
import { createAuditLog } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const { DB } = process.env;
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const sessionType = searchParams.get('sessionType');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    // Get sessions with filters
    const sessions = await getSessions(DB, {
      session_type: sessionType,
      status,
      limit
    });
    
    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  const { DB } = process.env;
  const data = await request.json();
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { session_type, location_id, notes } = data;
    
    if (!session_type || !location_id) {
      return new Response(JSON.stringify({ error: 'Session type and location ID are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const session = await createSession(DB, { session_type, location_id, notes }, user.id);
    
    // Create audit log
    await createAuditLog(
      DB,
      user.id,
      'create',
      'session',
      session.id,
      { session_type, location_id },
      request.headers.get('x-forwarded-for') || ''
    );
    
    return new Response(JSON.stringify({ session }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
