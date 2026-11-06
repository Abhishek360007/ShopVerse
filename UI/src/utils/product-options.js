// Colour options offered in the admin product forms.
// "Standard" is for products that don't come in colours (books, serums, ...).
export const productColors = [
  'Standard', 'Black', 'White', 'Gray', 'Navy', 'Blue', 'Red', 'Green',
  'Yellow', 'Orange', 'Pink', 'Purple', 'Brown', 'Beige', 'Silver', 'Gold',
];

export const colorChoices = productColors.map((color) => ({ id: color, name: color }));
