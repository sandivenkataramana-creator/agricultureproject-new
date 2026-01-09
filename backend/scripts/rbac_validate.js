(async function () {
  let fetch = global.fetch;
  if (!fetch) {
    const nf = await import('node-fetch');
    fetch = nf.default;
  }

  const app = require('../server');

  function jsonHeaders(token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  function ok(expectTrue, message) {
    if (!expectTrue) throw new Error(message);
  }

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const { port } = server.address();
  const base = `http://localhost:${port}/api`;

  try {
    // Login admin
    const adminLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ username: 'admin', password: 'password123' })
    });
    const adminLogin = await adminLoginRes.json().catch(() => ({}));
    ok(adminLoginRes.ok && adminLogin.token, `Admin login failed: status=${adminLoginRes.status}`);

    // Admin write should be forbidden
    const name = `RBAC Test Category ${new Date().toISOString()}`;
    const adminCreateRes = await fetch(`${base}/categories`, {
      method: 'POST',
      headers: jsonHeaders(adminLogin.token),
      body: JSON.stringify({ name, description: 'RBAC test' })
    });
    console.log('ADMIN_CREATE_CATEGORY_STATUS', adminCreateRes.status);
    ok(adminCreateRes.status === 403, `Expected admin create category to be 403, got ${adminCreateRes.status}`);

    // Login superadmin
    const saLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ username: 'superadmin', password: 'superadmin123' })
    });
    const saLogin = await saLoginRes.json().catch(() => ({}));
    ok(saLoginRes.ok && saLogin.token, `Superadmin login failed: status=${saLoginRes.status}`);

    // Superadmin write should succeed
    const saCreateRes = await fetch(`${base}/categories`, {
      method: 'POST',
      headers: jsonHeaders(saLogin.token),
      body: JSON.stringify({ name, description: 'RBAC test' })
    });
    const saCreate = await saCreateRes.json().catch(() => ({}));
    console.log('SUPERADMIN_CREATE_CATEGORY_STATUS', saCreateRes.status);
    ok(saCreateRes.status === 201 && saCreate.id, `Expected superadmin create category 201 with id, got ${saCreateRes.status}`);

    // Cleanup
    const saDeleteRes = await fetch(`${base}/categories/${saCreate.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${saLogin.token}` }
    });
    console.log('SUPERADMIN_DELETE_CATEGORY_STATUS', saDeleteRes.status);
    ok(saDeleteRes.ok, `Expected superadmin delete category 200, got ${saDeleteRes.status}`);

    console.log('RBAC validation passed');
    process.exit(0);
  } catch (err) {
    console.error('RBAC validation failed:', err.message || err);
    process.exit(1);
  } finally {
    try {
      server.close();
    } catch (_) {}
  }
})();
