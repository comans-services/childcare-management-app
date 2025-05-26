
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";

// Test configuration
const TEST_CONFIG = {
  userA: {
    email: "test-user-a@example.com",
    password: "testpassword123",
    name: "Test User A"
  },
  userB: {
    email: "test-user-b@example.com", 
    password: "testpassword123",
    name: "Test User B"
  },
  project: {
    name: "Test Project for Security",
    description: "Project for testing RLS",
    budget_hours: 40
  }
};

// Helper to clean up auth state
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
};

// Helper to sign up a user if they don't exist
const ensureUserExists = async (email: string, password: string, fullName: string) => {
  try {
    // Try to sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!signInError) {
      console.log(`User ${email} already exists and can sign in`);
      return;
    }
    
    // If sign in failed, try to sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (signUpError) {
      console.error(`Failed to create user ${email}:`, signUpError);
      throw signUpError;
    }
    
    console.log(`User ${email} created successfully`);
  } catch (error) {
    console.error(`Error ensuring user ${email} exists:`, error);
    throw error;
  }
};

// Helper to create a project for testing
const createTestProject = async () => {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: TEST_CONFIG.project.name,
      description: TEST_CONFIG.project.description,
      budget_hours: TEST_CONFIG.project.budget_hours,
      is_active: true
    })
    .select()
    .single();
    
  if (error) {
    console.error("Failed to create test project:", error);
    throw error;
  }
  
  return data;
};

// Helper to sign in a user
const signInUser = async (email: string, password: string) => {
  cleanupAuthState();
  
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    // Ignore errors
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error(`Failed to sign in user ${email}:`, error);
    throw error;
  }
  
  console.log(`Successfully signed in user: ${email}`);
  return data;
};

// Helper to sign out current user
const signOutUser = async () => {
  try {
    cleanupAuthState();
    await supabase.auth.signOut({ scope: 'global' });
    console.log("Successfully signed out");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

// Helper to create a timesheet entry
const createTimesheetEntry = async (projectId: string, hours: number = 8) => {
  const today = new Date();
  const entryDate = formatDate(today);
  
  const { data, error } = await supabase
    .from("timesheet_entries")
    .insert({
      project_id: projectId,
      entry_date: entryDate,
      hours_logged: hours,
      notes: `Test entry created by ${(await supabase.auth.getUser()).data.user?.email}`,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Failed to create timesheet entry:", error);
    throw error;
  }
  
  console.log("Created timesheet entry:", data);
  return data;
};

// Helper to fetch timesheet entries
const fetchTimesheetEntries = async () => {
  const { data, error } = await supabase
    .from("timesheet_entries")
    .select("*");
    
  if (error) {
    console.error("Failed to fetch timesheet entries:", error);
    throw error;
  }
  
  return data || [];
};

// Helper to fetch specific entry by ID
const fetchEntryById = async (entryId: string) => {
  const { data, error } = await supabase
    .from("timesheet_entries")
    .select("*")
    .eq("id", entryId);
    
  if (error) {
    console.error("Failed to fetch entry by ID:", error);
    throw error;
  }
  
  return data || [];
};

// Clean up test data
const cleanupTestData = async () => {
  try {
    // Delete test project (this will cascade delete entries)
    await supabase
      .from("projects")
      .delete()
      .eq("name", TEST_CONFIG.project.name);
    
    console.log("Cleaned up test data");
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
};

// Main test function
export const runTimesheetSecurityTest = async () => {
  console.log("🔒 Starting Timesheet Security E2E Test");
  
  let testProject: any = null;
  let userAEntry: any = null;
  
  try {
    // === SETUP PHASE ===
    console.log("\n📋 Setting up test users and project...");
    
    // Ensure both test users exist
    await ensureUserExists(TEST_CONFIG.userA.email, TEST_CONFIG.userA.password, TEST_CONFIG.userA.name);
    await ensureUserExists(TEST_CONFIG.userB.email, TEST_CONFIG.userB.password, TEST_CONFIG.userB.name);
    
    // Sign in as User A to create the project
    await signInUser(TEST_CONFIG.userA.email, TEST_CONFIG.userA.password);
    testProject = await createTestProject();
    
    // === TEST 1: User A creates timesheet entry ===
    console.log("\n✅ TEST 1: User A creates timesheet entry");
    userAEntry = await createTimesheetEntry(testProject.id, 8);
    
    // Verify User A can see their own entry
    const userAEntries = await fetchTimesheetEntries();
    console.log(`User A can see ${userAEntries.length} entries`);
    
    if (userAEntries.length !== 1 || userAEntries[0].id !== userAEntry.id) {
      throw new Error("❌ FAIL: User A cannot see their own entry");
    }
    console.log("✅ PASS: User A can see their own entry");
    
    // === TEST 2: Switch to User B and verify isolation ===
    console.log("\n🔄 TEST 2: Switching to User B and checking entry visibility");
    
    await signOutUser();
    await signInUser(TEST_CONFIG.userB.email, TEST_CONFIG.userB.password);
    
    // User B should NOT see User A's entries
    const userBEntries = await fetchTimesheetEntries();
    console.log(`User B can see ${userBEntries.length} entries`);
    
    if (userBEntries.length !== 0) {
      console.error("❌ FAIL: User B can see entries that don't belong to them:", userBEntries);
      throw new Error("❌ FAIL: RLS is not working - User B can see User A's entries");
    }
    console.log("✅ PASS: User B cannot see User A's entries");
    
    // === TEST 3: Direct fetch by ID should also return 0 rows ===
    console.log("\n🎯 TEST 3: Direct fetch by entry ID from User B");
    
    const directFetchResult = await fetchEntryById(userAEntry.id);
    console.log(`Direct fetch by ID returned ${directFetchResult.length} rows`);
    
    if (directFetchResult.length !== 0) {
      console.error("❌ FAIL: User B can directly fetch User A's entry by ID:", directFetchResult);
      throw new Error("❌ FAIL: RLS is not working - User B can fetch User A's entry by ID");
    }
    console.log("✅ PASS: User B cannot fetch User A's entry by ID");
    
    // === TEST 4: User B creates their own entry ===
    console.log("\n📝 TEST 4: User B creates their own entry");
    
    const userBEntry = await createTimesheetEntry(testProject.id, 6);
    const userBEntriesAfterCreate = await fetchTimesheetEntries();
    
    if (userBEntriesAfterCreate.length !== 1 || userBEntriesAfterCreate[0].id !== userBEntry.id) {
      throw new Error("❌ FAIL: User B cannot see their own entry");
    }
    console.log("✅ PASS: User B can see their own entry");
    
    // === TEST 5: Switch back to User A and verify they only see their entry ===
    console.log("\n🔄 TEST 5: Switch back to User A and verify isolation");
    
    await signOutUser();
    await signInUser(TEST_CONFIG.userA.email, TEST_CONFIG.userA.password);
    
    const userAEntriesAfterB = await fetchTimesheetEntries();
    console.log(`User A can see ${userAEntriesAfterB.length} entries after User B created theirs`);
    
    if (userAEntriesAfterB.length !== 1 || userAEntriesAfterB[0].id !== userAEntry.id) {
      console.error("❌ FAIL: User A sees wrong entries:", userAEntriesAfterB);
      throw new Error("❌ FAIL: User A cannot see only their own entry");
    }
    console.log("✅ PASS: User A still only sees their own entry");
    
    console.log("\n🎉 ALL TESTS PASSED! RLS is working correctly for timesheet entries.");
    
  } catch (error) {
    console.error("\n💥 TEST FAILED:", error);
    throw error;
  } finally {
    // === CLEANUP ===
    console.log("\n🧹 Cleaning up test data...");
    await signOutUser();
    
    // Sign in as User A to clean up (since they created the project)
    try {
      await signInUser(TEST_CONFIG.userA.email, TEST_CONFIG.userA.password);
      await cleanupTestData();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
    
    await signOutUser();
    console.log("✅ Cleanup completed");
  }
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).runTimesheetSecurityTest = runTimesheetSecurityTest;
}
