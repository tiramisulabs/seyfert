import type {
	APIButtonComponent,
	APIContainerComponent,
	APIContainerComponents,
	APIFileComponent,
	APIMediaGalleryComponent,
	APIMediaGalleryItems,
	APISectionComponent,
	APIThumbnailComponent,
	APITopLevelComponent,
	APIUnfurledMediaItem,
} from '../payloads/components';

/** Media fields accepted when sending components. Discord supplies the remaining fields in responses. */
export type RESTAPIUnfurledMediaItem = Pick<APIUnfurledMediaItem, 'url'>;

/** Thumbnail payload with only app-configurable media fields. */
export interface RESTAPIThumbnailComponent extends Omit<APIThumbnailComponent, 'media'> {
	media: RESTAPIUnfurledMediaItem;
}

/** Gallery item payload with only app-configurable media fields. */
export interface RESTAPIMediaGalleryItems extends Omit<APIMediaGalleryItems, 'media'> {
	media: RESTAPIUnfurledMediaItem;
}

/** Gallery payload containing outbound media items. */
export interface RESTAPIMediaGalleryComponent extends Omit<APIMediaGalleryComponent, 'items'> {
	items: RESTAPIMediaGalleryItems[];
}

/** File payload with only app-configurable media fields. */
export interface RESTAPIFileComponent extends Omit<APIFileComponent, 'file'> {
	file: RESTAPIUnfurledMediaItem;
}

/** Section payload whose thumbnail accessory uses outbound media fields. */
export interface RESTAPISectionComponent extends Omit<APISectionComponent, 'accessory'> {
	accessory: APIButtonComponent | RESTAPIThumbnailComponent;
}

/** Component payloads accepted inside a container. */
export type RESTAPIContainerComponents =
	| Exclude<
			APIContainerComponents,
			APISectionComponent | APIMediaGalleryComponent | APIFileComponent | APIThumbnailComponent
	  >
	| RESTAPISectionComponent
	| RESTAPIMediaGalleryComponent
	| RESTAPIFileComponent
	| RESTAPIThumbnailComponent;

/** Container payload containing outbound components. */
export interface RESTAPIContainerComponent extends Omit<APIContainerComponent, 'components'> {
	components: RESTAPIContainerComponents[];
}

/** Top-level component payloads accepted when sending or editing messages. */
export type RESTAPITopLevelComponent =
	| Exclude<
			APITopLevelComponent,
			APIContainerComponent | APISectionComponent | APIMediaGalleryComponent | APIFileComponent
	  >
	| RESTAPIContainerComponent
	| RESTAPISectionComponent
	| RESTAPIMediaGalleryComponent
	| RESTAPIFileComponent;
