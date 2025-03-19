// API route handlers for products
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductByBarcode } from '@/lib/products';
import { createAuditLog } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const { DB } = process.env;
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search');
  const active = searchParams.get('active') !== 'false';
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    // Get products with filters
    const products = await getProducts(DB, {
      categoryId,
      search,
      active,
      limit,
      offset
    });
    
    return new Response(JSON.stringify({ products }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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
    const product = await createProduct(DB, data, user.id);
    
    // Create audit log
    await createAuditLog(
      DB,
      user.id,
      'create',
      'product',
      product.id,
      { name: product.name },
      request.headers.get('x-forwarded-for') || ''
    );
    
    return new Response(JSON.stringify({ product }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
