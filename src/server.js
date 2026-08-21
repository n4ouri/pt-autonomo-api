import { app } from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🇵🇹 Portuguese Autónomo & Tax Optimization API running!`);
  console.log(`🌐 Server URL:        http://localhost:${PORT}`);
  console.log(`📖 Interactive Docs:  http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI 3.0 Spec:  http://localhost:${PORT}/openapi.json`);
  console.log(`⚡ Health Check:      http://localhost:${PORT}/api/v1/health`);
  console.log(`=======================================================`);
});
