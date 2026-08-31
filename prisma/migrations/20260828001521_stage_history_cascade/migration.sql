-- DropForeignKey
ALTER TABLE "StageHistory" DROP CONSTRAINT "StageHistory_toStageId_fkey";

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
