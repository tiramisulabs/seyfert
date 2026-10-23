import { MediaGalleryItem } from 'seyfert';

// Consumers can clear optional fields on the mutable JSON returned by builders.
const galleryItem = new MediaGalleryItem().setMedia('https://example.com/image.png').toJSON();
galleryItem.description = undefined;
galleryItem.spoiler = undefined;
galleryItem.media = undefined;

// @ts-expect-error descriptions still require strings when present
galleryItem.description = 1;
// @ts-expect-error spoiler flags still require booleans when present
galleryItem.spoiler = 'yes';
// @ts-expect-error media still requires a URL when present
galleryItem.media = {};
