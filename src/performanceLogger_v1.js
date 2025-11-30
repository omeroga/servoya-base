const memory = [];

export async function logPerformance(entry) {
  memory.push({ ...entry, loggedAt: new Date().toISOString() });
  if (memory.length > 1000) {
    memory.shift();
  }
}