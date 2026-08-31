# Testing checklist
1. `python train.py` -> accuracy/F1 and model files.
2. Start `uvicorn app.main:app --reload --port 8000`.
3. Open `/docs` and test POST `/api/tickets`.
4. Start React with `npm run dev`.
5. Test Billing, Technical Issue, Account Access, Shipping & Delivery, Product Issue, Cancellation & Refund.
6. Test High urgency using: `URGENT! Someone hacked my account. Help immediately.`
7. Test empty input.
8. Confirm history and delete functions.
