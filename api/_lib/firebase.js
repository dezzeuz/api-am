// Firebase REST API helper (tanpa SDK, pure fetch)
const BASE_URL = 'https://dezztoolsv2-default-rtdb.firebaseio.com';

export async function get(path) {
  const res = await fetch(`${BASE_URL}/${path}.json`);
  return res.json();
}

export async function set(path, data) {
  const res = await fetch(`${BASE_URL}/${path}.json`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function remove(path) {
  const res = await fetch(`${BASE_URL}/${path}.json`, { method: 'DELETE' });
  return res.json();
}
