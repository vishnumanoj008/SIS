const hfetch = require('node-fetch');

app.post('/your-form-endpoint', async (req, res) => {
  const token = req.body['h-captcha-response'];
  const secret = 'YOUR_SECRET_KEY';

  const verificationURL = `https://hcaptcha.com/siteverify?secret=${secret}&response=${token}`;

  const response = await hfetch(verificationURL, { method: 'POST' });
  const data = await response.json();

  if (data.success) {
    // captcha valid - proceed with form handling
    res.send('Captcha verified successfully!');
  } else {
    // captcha invalid
    res.status(400).send('Could not validate hCaptcha. Please try later');
  }
});
