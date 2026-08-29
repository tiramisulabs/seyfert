import { type APIFileUploadComponent, ComponentType, FileUpload, type FileUploadType } from 'seyfert';

declare function expectType<T>(value: T): void;

expectType<APIFileUploadComponent>({
	type: ComponentType.FileUpload,
	custom_id: 'documents',
	file_types: ['image', '.pdf'],
});
new FileUpload().setFileTypes('image', '.pdf');

declare const fileUploadType: FileUploadType;
expectType<'audio' | 'image' | 'video' | `.${string}`>(fileUploadType);
