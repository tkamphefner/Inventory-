// API route handlers for authentication
import { authenticateUser, createUser, getUserById } from '@/lib/auth';
import { createAuditLog } from '@/lib/db';

export async function POST(request, { params }) {
  const { DB } = process.env;
  const { action } = params;
  const data = await request.json();
  
  try {
    switch (action) {
      case 'login':
        const { username, password } = data;
        if (!username || !password) {
          return new Response(JSON.stringify({ error: 'Username and password are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const authResult = await authenticateUser(DB, username, password);
        
        // Create audit log
        await createAuditLog(
          DB,
          authResult.user.id,
          'login',
          'user',
          authResult.user.id,
          { username: authResult.user.username },
          request.headers.get('x-forwarded-for') || ''
        );
        
        return new Response(JSON.stringify(authResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'register':
        const { username: newUsername, password: newPassword, email, full_name, role } = data;
        
        if (!newUsername || !newPassword) {
          return new Response(JSON.stringify({ error: 'Username and password are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const newUser = await createUser(DB, {
          username: newUsername,
          password: newPassword,
          email,
          full_name,
          role: role || 'staff'
        });
        
        // Create audit log
        await createAuditLog(
          DB,
          newUser.id,
          'register',
          'user',
          newUser.id,
          { username: newUser.username },
          request.headers.get('x-forwarded-for') || ''
        );
        
        return new Response(JSON.stringify({ user: newUser }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
