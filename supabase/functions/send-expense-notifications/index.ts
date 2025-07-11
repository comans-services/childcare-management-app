import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'expense_submitted' | 'expense_approved' | 'expense_rejected' | 'expense_reminder';
  expenseId: string;
  recipientEmail?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, expenseId, recipientEmail, message }: EmailRequest = await req.json()

    // Fetch expense details
    const { data: expense, error: expenseError } = await supabaseClient
      .from('expenses')
      .select(`
        *,
        category:expense_categories(name),
        subcategory:expense_subcategories(name),
        user:profiles!expenses_user_id_fkey(full_name, email),
        approver:profiles!expenses_approved_by_fkey(full_name, email)
      `)
      .eq('id', expenseId)
      .single()

    if (expenseError || !expense) {
      throw new Error('Expense not found')
    }

    // Get admin emails for notifications
    const { data: admins } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'admin')

    let emailData = {}
    let subject = ''
    let toEmails: string[] = []

    switch (type) {
      case 'expense_submitted':
        subject = `New Expense Submitted - ${expense.user.full_name}`
        toEmails = admins?.map(admin => admin.email).filter(Boolean) || []
        emailData = {
          subject,
          expense_id: expense.id,
          employee_name: expense.user.full_name,
          expense_amount: new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
          }).format(expense.amount),
          expense_category: expense.category?.name || 'Unknown',
          expense_description: expense.description || 'No description',
          expense_date: new Date(expense.expense_date).toLocaleDateString('en-AU'),
          view_url: `${Deno.env.get('SITE_URL')}/expenses`
        }
        break

      case 'expense_approved':
        subject = `Expense Approved - ${expense.category?.name || 'Expense'}`
        toEmails = [expense.user.email].filter(Boolean)
        emailData = {
          subject,
          expense_id: expense.id,
          expense_amount: new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
          }).format(expense.amount),
          expense_category: expense.category?.name || 'Unknown',
          expense_description: expense.description || 'No description',
          expense_date: new Date(expense.expense_date).toLocaleDateString('en-AU'),
          approver_name: expense.approver?.full_name || 'Administrator',
          approval_date: new Date(expense.approved_at).toLocaleDateString('en-AU'),
          notes: expense.notes || '',
          view_url: `${Deno.env.get('SITE_URL')}/expenses`
        }
        break

      case 'expense_rejected':
        subject = `Expense Rejected - ${expense.category?.name || 'Expense'}`
        toEmails = [expense.user.email].filter(Boolean)
        emailData = {
          subject,
          expense_id: expense.id,
          expense_amount: new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD'
          }).format(expense.amount),
          expense_category: expense.category?.name || 'Unknown',
          expense_description: expense.description || 'No description',
          expense_date: new Date(expense.expense_date).toLocaleDateString('en-AU'),
          rejection_reason: expense.rejection_reason || 'No reason provided',
          rejector_name: expense.approver?.full_name || 'Administrator',
          notes: expense.notes || '',
          view_url: `${Deno.env.get('SITE_URL')}/expenses`
        }
        break

      case 'expense_reminder':
        if (recipientEmail) {
          toEmails = [recipientEmail]
          subject = 'Pending Expense Approvals Reminder'
          emailData = {
            subject,
            message: message || 'You have pending expense approvals that require your attention.',
            view_url: `${Deno.env.get('SITE_URL')}/expenses`
          }
        }
        break

      default:
        throw new Error('Invalid email type')
    }

    // Send emails using Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API key not configured')
    }

    const emailPromises = toEmails.map(email => 
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@yourcompany.com',
          to: [email],
          subject,
          html: generateEmailHTML(type, emailData),
        }),
      })
    )

    const results = await Promise.allSettled(emailPromises)
    const successCount = results.filter(result => result.status === 'fulfilled').length

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successCount,
        totalRecipients: toEmails.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending expense notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})

function generateEmailHTML(type: string, data: any): string {
  const baseStyle = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .content { padding: 20px 0; }
      .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0; }
      .expense-details { background: #f8f9fa; padding: 16px; border-radius: 4px; margin: 16px 0; }
      .expense-details h3 { margin-top: 0; }
      .footer { border-top: 1px solid #ddd; padding-top: 16px; margin-top: 24px; color: #666; font-size: 14px; }
    </style>
  `

  switch (type) {
    case 'expense_submitted':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>New Expense Submitted</h1>
          </div>
          <div class="content">
            <p>A new expense has been submitted and requires your review.</p>
            
            <div class="expense-details">
              <h3>Expense Details</h3>
              <p><strong>Employee:</strong> ${data.employee_name}</p>
              <p><strong>Amount:</strong> ${data.expense_amount}</p>
              <p><strong>Category:</strong> ${data.expense_category}</p>
              <p><strong>Date:</strong> ${data.expense_date}</p>
              <p><strong>Description:</strong> ${data.expense_description}</p>
            </div>
            
            <a href="${data.view_url}" class="button">Review Expense</a>
          </div>
          <div class="footer">
            <p>This is an automated message from your expense management system.</p>
          </div>
        </div>
      `

    case 'expense_approved':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Expense Approved ✅</h1>
          </div>
          <div class="content">
            <p>Good news! Your expense has been approved.</p>
            
            <div class="expense-details">
              <h3>Expense Details</h3>
              <p><strong>Amount:</strong> ${data.expense_amount}</p>
              <p><strong>Category:</strong> ${data.expense_category}</p>
              <p><strong>Date:</strong> ${data.expense_date}</p>
              <p><strong>Description:</strong> ${data.expense_description}</p>
              <p><strong>Approved by:</strong> ${data.approver_name}</p>
              <p><strong>Approval Date:</strong> ${data.approval_date}</p>
              ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <a href="${data.view_url}" class="button">View Expense</a>
          </div>
          <div class="footer">
            <p>This is an automated message from your expense management system.</p>
          </div>
        </div>
      `

    case 'expense_rejected':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Expense Rejected ❌</h1>
          </div>
          <div class="content">
            <p>Your expense has been rejected. Please review the details below.</p>
            
            <div class="expense-details">
              <h3>Expense Details</h3>
              <p><strong>Amount:</strong> ${data.expense_amount}</p>
              <p><strong>Category:</strong> ${data.expense_category}</p>
              <p><strong>Date:</strong> ${data.expense_date}</p>
              <p><strong>Description:</strong> ${data.expense_description}</p>
              <p><strong>Rejected by:</strong> ${data.rejector_name}</p>
              <p><strong>Reason:</strong> ${data.rejection_reason}</p>
              ${data.notes ? `<p><strong>Additional Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <a href="${data.view_url}" class="button">View Expense</a>
          </div>
          <div class="footer">
            <p>This is an automated message from your expense management system.</p>
          </div>
        </div>
      `

    case 'expense_reminder':
      return `
        ${baseStyle}
        <div class="container">
          <div class="header">
            <h1>Pending Expense Approvals</h1>
          </div>
          <div class="content">
            <p>${data.message}</p>
            <a href="${data.view_url}" class="button">Review Expenses</a>
          </div>
          <div class="footer">
            <p>This is an automated message from your expense management system.</p>
          </div>
        </div>
      `

    default:
      return '<p>Email content not available</p>'
  }
}