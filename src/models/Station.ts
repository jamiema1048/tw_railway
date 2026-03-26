import mongoose, { Schema, model, models } from "mongoose";

const StationSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: String,
    status: {
      type: String,
      enum: ["active", "disused", "plan"],
      default: "active",
    },
    openDate: String,
    closeDate: String,
    originalName: String,
    level: String,
    miles: String,
    height: String,
    stationCode: String,
    line: [
      {
        lineID: { type: Number, required: true },
        lineDistrict: {
          id: { type: Number, required: true },
          order: { type: Number, required: true },
        },
      },
    ],
    prevStation: { type: [Number], default: [] },
    nextStation: { type: [Number], default: [] },

    hasDetail: { type: Boolean, default: true },
    images: [
      {
        url: { type: String, required: true }, // 圖片位址
        description: { type: String }, // 圖片描述
        capturedAt: { type: Date, default: Date.now }, // 選填：拍攝日期
      },
    ],
  },
  { timestamps: true },
);

// 如果 model 已經存在就直接用，不存在就建立一個新的
const Station = models.Station || model("Station", StationSchema);
export default Station;
