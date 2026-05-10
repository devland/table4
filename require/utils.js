module.exports = {
  log: (item) => {
    const now = new Date();
    process.stdout.write(`[${now.toISOString()}]: `);
    console.log(item);
  }
}
