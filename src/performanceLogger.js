export function logPerformance(action, success) {
  console.log(`📊 Performance Log → ${action}: ${success ? "OK" : "FAIL"}`);
}