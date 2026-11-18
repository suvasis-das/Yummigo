const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const mongoose = require("mongoose");

process.env.SECRET_KEY = process.env.SECRET_KEY || "test_secret_key_for_yummigo_suite";
process.env.SEED_DEMO_DATA = "false";

const app = require("../server");
const connectDb = require("../config/connectionDb");
const { ensureDemoSeed } = require("../seed");

let server;
let baseUrl;

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

test.before(async () => {
  if (!process.env.MONGODB_URI && !process.env.CONNECTION_STRING) {
    throw new Error("Set MONGODB_URI or CONNECTION_STRING to run API tests");
  }
  await connectDb();
  await mongoose.connection.db.dropDatabase();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});

test("Health endpoints return connected status", async () => {
  const res1 = await fetch(`${baseUrl}/health`);
  assert.equal(res1.status, 200);
  const body1 = await res1.json();
  assert.equal(body1.status, "ok");

  const res2 = await fetch(`${baseUrl}/api/health`);
  assert.equal(res2.status, 200);
});

test("Full user auth & recipe CRUD + authorization workflow", async () => {
  // 1. Signup validation
  let res = await fetch(`${baseUrl}/signUp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "bad-email", password: "123" }),
  });
  assert.equal(res.status, 400);

  // 2. Register user 1
  res = await fetch(`${baseUrl}/signUp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ChefOne@Example.com", password: "password123" }),
  });
  assert.equal(res.status, 201);
  const signup1 = await res.json();
  assert.ok(signup1.token);
  assert.equal(signup1.user.email, "chefone@example.com");
  assert.equal(signup1.user.password, undefined, "Password hash must never be exposed");

  // 3. Duplicate email rejected
  res = await fetch(`${baseUrl}/signUp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "chefone@example.com", password: "password123" }),
  });
  assert.equal(res.status, 409);

  // 4. Register user 2
  res = await fetch(`${baseUrl}/api/signUp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "cheftwo@example.com", password: "password456" }),
  });
  assert.equal(res.status, 201);
  const signup2 = await res.json();

  // 5. Login valid & invalid
  res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "CHEFONE@example.com", password: "password123" }),
  });
  assert.equal(res.status, 200);
  const login1 = await res.json();
  assert.equal(login1.user.password, undefined);

  res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "chefone@example.com", password: "wrongpassword" }),
  });
  assert.equal(res.status, 401);

  // 6. GET /user/:id
  res = await fetch(`${baseUrl}/user/${signup1.user._id}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).email, "chefone@example.com");

  res = await fetch(`${baseUrl}/user/not-an-object-id`);
  assert.equal(res.status, 400);

  // 7. Reject unauthenticated & invalid token recipe creation
  const badFd = new FormData();
  badFd.append("title", "Unauthorized Dish");
  badFd.append("ingredients", "Salt");
  badFd.append("instructions", "Mix");
  res = await fetch(`${baseUrl}/recipe`, { method: "POST", body: badFd });
  assert.equal(res.status, 401);

  res = await fetch(`${baseUrl}/recipe`, {
    method: "POST",
    headers: { authorization: "Bearer invalid.jwt.token" },
    body: badFd,
  });
  assert.equal(res.status, 401);

  // 8. Reject missing required fields with 400
  const emptyFd = new FormData();
  emptyFd.append("title", "");
  res = await fetch(`${baseUrl}/recipe`, {
    method: "POST",
    headers: { authorization: `Bearer ${signup1.token}` },
    body: emptyFd,
  });
  assert.equal(res.status, 400);

  // 9. Reject non-image upload
  const txtFd = new FormData();
  txtFd.append("title", "Text Upload");
  txtFd.append("ingredients", "Water");
  txtFd.append("instructions", "Boil");
  txtFd.append("file", new Blob(["hello"], { type: "text/plain" }), "note.txt");
  res = await fetch(`${baseUrl}/recipe`, {
    method: "POST",
    headers: { authorization: `Bearer ${signup1.token}` },
    body: txtFd,
  });
  assert.equal(res.status, 400);

  // 10. Create recipe WITH valid PNG image (stored as data URI)
  const fd = new FormData();
  fd.append("title", "Garlic Butter Pasta");
  fd.append("time", "20 mins");
  fd.append("ingredients", "Pasta, Garlic, Butter, Parmesan");
  fd.append("instructions", "Boil pasta and toss with garlic butter.");
  fd.append("file", new Blob([PNG_1X1], { type: "image/png" }), "pasta.png");
  res = await fetch(`${baseUrl}/api/recipe`, {
    method: "POST",
    headers: { authorization: `Bearer ${signup1.token}` },
    body: fd,
  });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.title, "Garlic Butter Pasta");
  assert.deepEqual(created.ingredients, ["Pasta", "Garlic", "Butter", "Parmesan"]);
  assert.ok(created.coverImage.startsWith("data:image/png;base64,"));

  // 11. List & search recipes
  res = await fetch(`${baseUrl}/api/recipe?search=garlic`);
  assert.equal(res.status, 200);
  const searched = await res.json();
  assert.equal(searched.length, 1);
  assert.equal(searched[0]._id, created._id);

  res = await fetch(`${baseUrl}/api/recipe?search=nonexistentxyz`);
  assert.equal((await res.json()).length, 0);

  // 12. Get single recipe includes creator email
  res = await fetch(`${baseUrl}/api/recipe/${created._id}`);
  assert.equal(res.status, 200);
  const fetched = await res.json();
  assert.equal(fetched.email, "chefone@example.com");

  // 13. Security: unauthenticated PUT / DELETE rejected with 401
  res = await fetch(`${baseUrl}/recipe/${created._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hijacked" }),
  });
  assert.equal(res.status, 401);

  res = await fetch(`${baseUrl}/recipe/${created._id}`, { method: "DELETE" });
  assert.equal(res.status, 401);

  // 14. Security: another user cannot edit or delete user 1's recipe (403)
  res = await fetch(`${baseUrl}/recipe/${created._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${signup2.token}`,
    },
    body: JSON.stringify({ title: "Other User Edit" }),
  });
  assert.equal(res.status, 403);

  res = await fetch(`${baseUrl}/recipe/${created._id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${signup2.token}` },
  });
  assert.equal(res.status, 403);

  // 15. Owner can edit recipe (and cannot spoof createdBy)
  const editFd = new FormData();
  editFd.append("title", "Creamy Garlic Butter Pasta");
  editFd.append("time", "25 mins");
  editFd.append("ingredients", "Pasta, Garlic, Butter, Cream");
  editFd.append("instructions", "Boil pasta and simmer with garlic butter cream.");
  editFd.append("createdBy", signup2.user._id);
  res = await fetch(`${baseUrl}/api/recipe/${created._id}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${signup1.token}` },
    body: editFd,
  });
  assert.equal(res.status, 200);
  const edited = await res.json();
  assert.equal(edited.title, "Creamy Garlic Butter Pasta");
  assert.equal(edited.createdBy, signup1.user._id, "Ownership must not be overwritten");
  assert.ok(edited.coverImage.startsWith("data:image/png;base64,"), "Existing image preserved when no new file sent");

  // 16. Owner can delete recipe
  res = await fetch(`${baseUrl}/api/recipe/${created._id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${signup1.token}` },
  });
  assert.equal(res.status, 200);

  // 17. Deleted recipe returns 404
  res = await fetch(`${baseUrl}/api/recipe/${created._id}`);
  assert.equal(res.status, 404);
});

test("Demo seed populates starter recipes once and is idempotent", async () => {
  const first = await ensureDemoSeed();
  assert.equal(first.seeded, true);
  assert.ok(first.count >= 6);

  const second = await ensureDemoSeed();
  assert.equal(second.seeded, false);
});
