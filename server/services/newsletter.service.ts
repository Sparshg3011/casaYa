import fs from 'fs';
import path from 'path';
import { createSupabaseClient } from '../lib/supabase';
import { sendWelcomeEmail } from './email.service';

export interface NewsletterSubscriber {
  id?: string;
  name: string;
  email: string;
  subscribed_at: string;
  created_at: string;
}

export interface NewsletterSubscriptionResult {
  success: boolean;
  message: string;
  downloadUrl?: string;
}

export async function subscribeToNewsletter(name: string, email: string): Promise<NewsletterSubscriptionResult> {
  try {
    if (!name?.trim() || !email?.trim()) {
      throw new Error('Name and email are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please provide a valid email address');
    }

    const supabase = createSupabaseClient(true);

    const subscriberData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: existingSubscribers, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', subscriberData.email);

    if (checkError) {
      console.error('Error checking for existing subscriber:', checkError);
    } else if (existingSubscribers && existingSubscribers.length > 0) {
      return {
        success: false,
        message: 'This email is already subscribed to our newsletter'
      };
    }

    const { data: newSubscriber, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([subscriberData])
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to save subscription: ${insertError.message}`);
    }
    
    try {
      const emailResult = await sendWelcomeEmail(subscriberData.email, subscriberData.name);
      console.log('Welcome email sent successfully:', emailResult);
    } catch (emailError: any) {
      console.error('Welcome email error (subscription still successful):', {
        error: emailError.message,
        email: subscriberData.email,
        hasBrevoKey: !!process.env.BREVO_API_KEY,
        environment: process.env.NODE_ENV
      });
    }
    
    return {
      success: true,
      message: 'Successfully subscribed to newsletter!',
      downloadUrl: `/api/newsletter/download/${newSubscriber.id}`
    };

  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    throw new Error(`Failed to subscribe: ${error.message}`);
  }
}

export async function getSubscriber(subscriberId: string): Promise<NewsletterSubscriber | null> {
  try {
    const supabase = createSupabaseClient(true);
    
    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single();
    
    if (error || !subscriber) {
      return {
        id: subscriberId,
        name: 'Newsletter Subscriber',
        email: 'subscriber@example.com',
        subscribed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
    }

    return subscriber;
  } catch (error: any) {
    console.error('Get subscriber error:', error);
    return {
      id: subscriberId,
      name: 'Newsletter Subscriber',
      email: 'subscriber@example.com',
      subscribed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  }
}

export async function getAllSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const supabase = createSupabaseClient(true);
    
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get all subscribers error:', error);
      return [];
    }
    
    return subscribers || [];
  } catch (error: any) {
    console.error('Get all subscribers error:', error);
    return [];
  }
}

export function generateNewsletterPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const pdfPath = path.join(__dirname, '../downloads/DOC-20250718-WA0011..pdf');
      
      fs.readFile(pdfPath, (err, data) => {
        if (err) {
          console.error('Error reading PDF file:', err);
          reject(new Error('Failed to load PDF file'));
          return;
        }
        resolve(data);
      });
    } catch (error: any) {
      reject(new Error('Failed to generate PDF'));
    }
  });
} 