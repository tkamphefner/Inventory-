// API route handlers for inventory
import { getInventory, getInventorySummary, updateInventoryQuantity } from '@/lib/inventory';
import { createAuditLog } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const { DB } = process.env;
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const locationId = searchParams.get('locationId');
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search');
  const lowStock = searchParams.get('lowStock') === 'true';
  const summary = searchParams.get('summary') === 'true';
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    if (summary) {
      // Get inventory summary
      const summaryData = await getInventorySummary(DB);
      
      return new Response(JSON.stringify(summaryData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get inventory with filters
      const inventory = await getInventory(DB, {
        locationId,
        categoryId,
        search,
        lowStock,
        limit,
        offset
      });
      
      return new Response(JSON.stringify({ inventory }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
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
    const { productId, locationId, quantity } = data;
    
    if (!productId || !locationId || quantity === undefined) {
      return new Response(JSON.stringify({ error: 'Product ID, location ID, and quantity are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updatedInventory = await updateInventoryQuantity(DB, productId, locationId, quantity, user.id);
    
    // Create audit log
    await createAuditLog(
      DB,
      user.id,
      'update',
      'inventory',
      `${productId}-${locationId}`,
      { quantity },
      request.headers.get('x-forwarded-for') || ''
    );
    
    return new Response(JSON.stringify({ inventory: updatedInventory }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
