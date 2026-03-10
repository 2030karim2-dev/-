const url1 = "https://zzthamxjxnxzzpswllid.supabase.co/rest/v1/parties?select=*,balance,party_categories(id,name)&limit=1";
const url2 = "https://zzthamxjxnxzzpswllid.supabase.co/rest/v1/rpc/get_dashboard_totals";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dGhhbXhqeG54enpwc3dsbGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MjgsImV4cCI6MjA4NjgyNDQyOH0._-66pjzKBjUymrZrfeZSkC9Zt60Gdbgp8a7bTfzMwlw";

async function run() {
    try {
        const res1 = await fetch(url1, {
            headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` }
        });
        console.log("Parties API Status:", res1.status);
        console.log("Parties API Body:", await res1.text());

        const res2 = await fetch(url2, {
            method: "POST",
            headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ p_company_id: "c83421a2-a8d7-46ff-886c-a219e75ae1e6" })
        });
        console.log("Dashboard API Status:", res2.status);
        console.log("Dashboard API Body:", await res2.text());
    } catch (e) {
        console.error("Error fetching", e);
    }
}
run();
