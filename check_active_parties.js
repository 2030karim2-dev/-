const url_active = "https://zzthamxjxnxzzpswllid.supabase.co/rest/v1/active_parties?limit=1";
const url_parties = "https://zzthamxjxnxzzpswllid.supabase.co/rest/v1/parties?limit=1";
const apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dGhhbXhqeG54enpwc3dsbGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDg0MjgsImV4cCI6MjA4NjgyNDQyOH0._-66pjzKBjUymrZrfeZSkC9Zt60Gdbgp8a7bTfzMwlw";

async function run() {
    try {
        const res1 = await fetch(url_active, {
            headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` }
        });
        console.log("Active Parties Status:", res1.status);
        const body1 = await res1.text();
        console.log("Active Parties Body:", body1.substring(0, 200));

        const res2 = await fetch(url_parties, {
            headers: { "apikey": apikey, "Authorization": `Bearer ${apikey}` }
        });
        console.log("Parties Table Status:", res2.status);
        const body2 = await res2.text();
        console.log("Parties Table Body:", body2.substring(0, 200));

    } catch (e) {
        console.error("Error fetching", e);
    }
}
run();
