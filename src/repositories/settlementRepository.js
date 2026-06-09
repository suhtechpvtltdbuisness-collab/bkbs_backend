import Settlement from "../models/Settlement.js";

class SettlementRepository {
  async findByEmployeeAndDate(employeeId, date) {
    return await Settlement.findOne({ employeeId, date, isDeleted: false });
  }

  async upsert(employeeId, date, data, createdBy) {
    return await Settlement.findOneAndUpdate(
      { employeeId, date },
      {
        $set: { ...data, isDeleted: false },
        $setOnInsert: { employeeId, date, createdBy },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
      .populate("createdBy", "name email employeeId")
      .populate("updatedBy", "name email employeeId");
  }
}

export default new SettlementRepository();
