async function connect(port?: number) {
  port = port ?? 4000;
  const conn = await Deno.connect({ port: port });
  conn.close();
}

const max = 20;

for (let i = 0; i < max; i++) {
  try {
    await connect();
    break;
  } catch (e) {
    if (e instanceof Deno.errors.ConnectionRefused) {
      console.log(`retry to connect`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      console.error(e);
      break;
    }
  }
}
