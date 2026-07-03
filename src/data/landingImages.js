/** Landing page imagery — local assets where possible; Unsplash IDs elsewhere (sized at render) */
const U = (id) => `https://images.unsplash.com/${id}`

export const LANDING_IMAGES = {
  fallback: U('photo-1504674900247-0877df9cc836'),
  hero: U('photo-1414235077428-338989a2e8c0'),
  heroPizza: U('photo-1513104890138-7c749659a591'),
  heroBurger: '/images/hero-burger.png',
  heroNoodles: '/images/hero-noodles.png',
  galleryPizza: U('photo-1565299624946-b28f40a7ca7f'),
  galleryBurger: '/images/hero-burger.png',
  galleryPasta: U('photo-1473093290779-441010016dd3'),
  galleryWings: U('photo-1626082897516-8afb70ce5d3a'),
  galleryTacos: U('photo-1565299585325-38d6e1552959'),
  gallerySteak: U('photo-1546833999-b9f581a1996d'),
  galleryDessert: U('photo-1488477181946-6428a0291777'),
  galleryRamen: '/images/hero-noodles.png',
  diningRoom: U('photo-1555396273-367ea4eb4db5'),
  kitchen: U('photo-1556910103-1c02745aae4d'),
  spread: U('photo-1552566626-52f8b828add9'),
  rooftop: U('photo-1559339352-11d035aa65de'),
  contact: U('photo-1517248135467-4c7edcad34c4'),
  cta: U('photo-1544025162-d76694265947'),
  videoPoster: U('photo-1525351484163-7529414344d8'),
  demoVideo: '/videos/add-video.mp4',
}
