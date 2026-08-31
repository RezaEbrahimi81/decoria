async function pingApi() {
  try {
    const res = await fetch("http://localhost:3000/products?_limit=2");
    const products = await res.json();
    console.log("Mock API is working:", products);
  } catch {
    console.error("API is not running. Run: npm run api");
  }
}

pingApi();
