const fs = require('fs');

let code = fs.readFileSync('routes/authRoutes.ts', 'utf8');

const newRoute = `
router.post('/register-complete', async (req, res) => {
  try {
    const { accountData, addressData } = req.body;
    const formattedPhone = formatPhone(accountData.phone);
    
    // Check email
    if (accountData.email) {
      const { data: byEmail } = await supabaseAdmin.from('profiles').select('id, verified').eq('email', accountData.email).maybeSingle();
      if (byEmail) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
    }
    
    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: accountData.email,
      password: accountData.password,
      phone: formattedPhone,
      email_confirm: false,
      phone_confirm: false,
      user_metadata: {
        first_name: accountData.first_name,
        last_name: accountData.last_name,
        full_name: \`\${accountData.first_name} \${accountData.last_name}\`,
        phone: formattedPhone,
        phone_verified: false,
        role: 'customer'
      }
    });

    if (authError) {
       return res.status(400).json({ error: authError.message });
    }
    const userId = authData.user.id;

    // Save address if provided
    if (addressData) {
      const { error: addressError } = await supabaseAdmin.from('delivery_addresses').insert({
        user_id: userId,
        phone_number: accountData.phone,
        street_address: addressData.street || addressData.formatted_address || "",
        apartment_suite: addressData.apartment || addressData.house_number || "",
        city: addressData.town || "",
        county: addressData.county,
        postal_code: "",
        is_default: true,
      });
      if (addressError) {
        console.error("Failed to save address:", addressError);
      }
    }

    // Generate link for email confirmation
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: accountData.email,
      password: accountData.password,
    });
    
    if (linkData && linkData.properties?.action_link) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
        await resend.emails.send({
          from: 'ODA Market <noreply@odamarket.co.ke>', 
          to: accountData.email,
          subject: 'Confirm your ODA Market Account',
          html: \`
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
              <h1 style="color: #C65A28;">Welcome to ODA Market!</h1>
              <p style="font-size: 16px; color: #333;">Hi \${accountData.first_name},</p>
              <p style="font-size: 16px; color: #333;">Thanks for joining ODA Market. Please confirm your email address to activate your account.</p>
              <a href="\${linkData.properties.action_link}" style="display: inline-block; background-color: #C65A28; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Confirm Email</a>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          \`
        });
      } catch (e) {
        console.error("Resend error:", e);
      }
    }

    res.status(200).json({ success: true, userId: userId });
  } catch (error) {
    console.error('Failed to complete registration:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});
`;

code = code.replace(/export default router;/, newRoute + '\nexport default router;');

fs.writeFileSync('routes/authRoutes.ts', code);
console.log('Success');
