import { createCheckoutSession } from "./src/services/stripe.service.js";

async function run() {
  try {
    const session = await createCheckoutSession(
      500,
      "inr",
      "1234-abcd",
      "Test Campaign",
      "campaign-test-id",
      "donor@test.com",
      "user-test-id"
    );
    console.log("Success:", session.url);
  } catch (e) {
    console.error("Error creating session:");
    console.error(e);
  }
}

run();
