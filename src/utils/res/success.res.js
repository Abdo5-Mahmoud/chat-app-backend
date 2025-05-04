export const success = ({ res, statusCode = 200, data = "done" }) => {
  return res.status(+statusCode).json({
    data,
  });
};
