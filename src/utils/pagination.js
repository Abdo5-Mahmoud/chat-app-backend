import * as dbService from "../DB/db.service.js";

export const paginate = async ({
  page = process.env.PAGE,
  size = process.env.SIZE,
  model,
  filter = {},
  populate = [],
  select = "",
}) => {
  page = +(parseInt(page) < 1 ? 1 : page);
  size = +(parseInt(size) < 1 ? 1 : size);
  const skip = (page - 1) * size;
  const count = await model.find(filter).countDocuments();

  const result = await dbService.findAll({
    filter,
    model,
    populate,
    select,
    skip,
    limit: size,
  });
  return {
    total: count,
    page,
    size,
    result,
  };
};
