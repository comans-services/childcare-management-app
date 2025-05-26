
import { runTimesheetSecurityTest } from "./e2e-timesheet-security.test";

// Simple test runner script
const runTest = async () => {
  try {
    console.log("🚀 Starting Security Test Runner");
    await runTimesheetSecurityTest();
    console.log("✅ All security tests completed successfully!");
  } catch (error) {
    console.error("❌ Security tests failed:", error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  runTest();
}

export { runTest };
