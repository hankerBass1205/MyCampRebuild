export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US").format(Math.round(price));
};
