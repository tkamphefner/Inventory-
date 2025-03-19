// API route handlers for reports
import { getInventoryValuationReport, getTransactionHistoryReport, getLowStockReport, saveReport, getSavedReports, runSavedReport } from '@/lib/reports';
import { createAuditLog } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  const { DB } = process.env;
  const { searchParams } = new URL(request.url);
  
  // Extract query parameters
  const reportType = searchParams.get('type');
  const locationId = searchParams.get('locationId');
  const categoryId = searchParams.get('categoryId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const transactionType = searchParams.get('transactionType');
  const productId = searchParams.get('productId');
  const savedOnly = searchParams.get('savedOnly') === 'true';
  
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
    if (savedOnly) {
      // Get saved reports
      const reports = await getSavedReports(DB, {
        report_type: reportType,
        userId: user.id
      });
      
      return new Response(JSON.stringify({ reports }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Generate report based on type
      let report;
      
      switch (reportType) {
        case 'inventory':
          report = await getInventoryValuationReport(DB, { locationId, categoryId });
          break;
        case 'transaction':
          report = await getTransactionHistoryReport(DB, { 
            startDate, 
            endDate, 
            transactionType, 
            productId, 
            locationId 
          });
          break;
        case 'low_stock':
          report = await getLowStockReport(DB, { locationId, categoryId });
          break;
        default:
          return new Response(JSON.stringify({ error: 'Invalid report type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }
      
      return new Response(JSON.stringify(report), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
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
    const { name, report_type, parameters, schedule } = data;
    
    if (!name || !report_type) {
      return new Response(JSON.stringify({ error: 'Report name and type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const report = await saveReport(DB, { name, report_type, parameters, schedule }, user.id);
    
    // Create audit log
    await createAuditLog(
      DB,
      user.id,
      'create',
      'report',
      report.id,
      { name, report_type },
      request.headers.get('x-forwarded-for') || ''
    );
    
    return new Response(JSON.stringify({ report }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving report:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
