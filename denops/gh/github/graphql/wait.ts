const max = 60;
let count = 0;

while (true) {
  if (count > max) {
    console.log("timeout");
    break;
  }
  count++;
  try {
    const conn = await Deno.connect({
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 8080,
    });
    conn.close();
    break;
  } catch (e) {
    if (e instanceof Deno.errors.ConnectionRefused) {
      console.log("retry");
    } else {
      console.log(e);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
