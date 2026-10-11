import express from "express";
import { buildMessageUpdate } from "../security/access.js";

export const createMessageUpdateRouter = ({
  db,
  FieldValue,
  requireAdmin,
  areValidMessageRecipients,
  safeServerError,
}) => {
  const router = express.Router();

  router.put("/:id", requireAdmin, async (req, res) => {
    try {
      const updateResult = buildMessageUpdate(req.body);
      if (updateResult.error) {
        return res.status(400).json({ error: updateResult.error });
      }

      const updateData = updateResult.value;
      if (
        updateResult.audienceChanged &&
        !(await areValidMessageRecipients(updateData.recipientUids))
      ) {
        return res.status(400).json({
          error: "One or more selected recipients are not valid students.",
        });
      }

      const docRef = db
        .collection("messages")
        .doc(req.params.id.toString());
      const existing = await docRef.get();

      if (!existing.exists) {
        return res.status(404).json({
          error: "Message not found",
        });
      }

      if (updateResult.audienceChanged) {
        updateData.broadcast = FieldValue.delete();
        updateData.recipientUid = FieldValue.delete();
      }

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();

      return res.json({
        message: "Message updated",
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      });
    } catch (error) {
      console.error(error);
      return safeServerError(res, "Failed to update message.");
    }
  });

  return router;
};
