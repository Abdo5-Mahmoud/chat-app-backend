import * as dbServices from "../DB/db.service.js";

export const pagination = async ({
  page = 1,
  size = 2,
  model,
  filter = {},
  populate,
  select = "",
  sort = "-createdAt",
} = {}) => {
  page = parseInt(page) < 1 ? 1 : page;
  size = parseInt(size) < 1 ? 1 : size;
  const skip = (page - 1) * size;
  const count = await model.find(filter).populate().countDocuments();
  const result = await dbServices.findAll({
    model,
    filter,
    populate,
    select,
    skip,
    limit: size,
    sort, // Pass the sort parameter
  });
  return {
    page,
    size,
    count,
    result,
  };
};
