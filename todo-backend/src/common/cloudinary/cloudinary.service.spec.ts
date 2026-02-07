import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

// Mock cloudinary and streamifier
jest.mock('cloudinary');
jest.mock('streamifier');

describe('CloudinaryService', () => {
    let service: CloudinaryService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CloudinaryService],
        }).compile();

        service = module.get<CloudinaryService>(CloudinaryService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadFile', () => {
        it('should successfully upload a file to Cloudinary', async () => {
            const mockFile = {
                buffer: Buffer.from('test-image-data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const mockUploadResult = {
                public_id: 'profile_pictures/test123',
                secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/profile_pictures/test123.jpg',
                width: 500,
                height: 500,
                format: 'jpg',
            };

            // Mock the upload_stream method
            const mockUploadStream = jest.fn((options, callback) => {
                // Simulate successful upload
                setTimeout(() => callback(null, mockUploadResult), 0);
                return {
                    on: jest.fn(),
                    end: jest.fn(),
                };
            });

            (cloudinary.uploader.upload_stream as jest.Mock) = mockUploadStream;

            // Mock streamifier
            const mockReadStream = {
                pipe: jest.fn().mockReturnThis(),
            };
            (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

            const result = await service.uploadFile(mockFile);

            expect(result).toEqual(mockUploadResult);
            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                expect.objectContaining({
                    folder: 'profile_pictures',
                    resource_type: 'auto',
                    transformation: expect.arrayContaining([
                        { width: 500, height: 500, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' },
                    ]),
                }),
                expect.any(Function)
            );
            expect(streamifier.createReadStream).toHaveBeenCalledWith(mockFile.buffer);
            expect(mockReadStream.pipe).toHaveBeenCalled();
        });

        it('should upload to custom folder when specified', async () => {
            const mockFile = {
                buffer: Buffer.from('test-image-data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const mockUploadResult = {
                public_id: 'custom_folder/test123',
                secure_url: 'https://res.cloudinary.com/test/image/upload/v1234/custom_folder/test123.jpg',
            };

            const mockUploadStream = jest.fn((options, callback) => {
                setTimeout(() => callback(null, mockUploadResult), 0);
                return {
                    on: jest.fn(),
                    end: jest.fn(),
                };
            });

            (cloudinary.uploader.upload_stream as jest.Mock) = mockUploadStream;

            const mockReadStream = {
                pipe: jest.fn().mockReturnThis(),
            };
            (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

            const result = await service.uploadFile(mockFile, 'custom_folder');

            expect(result).toEqual(mockUploadResult);
            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                expect.objectContaining({
                    folder: 'custom_folder',
                }),
                expect.any(Function)
            );
        });

        it('should reject when Cloudinary returns an error', async () => {
            const mockFile = {
                buffer: Buffer.from('test-image-data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const mockError = new Error('Cloudinary upload failed');

            const mockUploadStream = jest.fn((options, callback) => {
                setTimeout(() => callback(mockError, null), 0);
                return {
                    on: jest.fn(),
                    end: jest.fn(),
                };
            });

            (cloudinary.uploader.upload_stream as jest.Mock) = mockUploadStream;

            const mockReadStream = {
                pipe: jest.fn().mockReturnThis(),
            };
            (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

            await expect(service.uploadFile(mockFile)).rejects.toThrow('Cloudinary upload failed');
        });

        it('should reject when result is undefined', async () => {
            const mockFile = {
                buffer: Buffer.from('test-image-data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const mockUploadStream = jest.fn((options, callback) => {
                setTimeout(() => callback(null, undefined), 0);
                return {
                    on: jest.fn(),
                    end: jest.fn(),
                };
            });

            (cloudinary.uploader.upload_stream as jest.Mock) = mockUploadStream;

            const mockReadStream = {
                pipe: jest.fn().mockReturnThis(),
            };
            (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

            await expect(service.uploadFile(mockFile)).rejects.toThrow('Cloudinary upload result is undefined');
        });

        it('should apply correct image transformations', async () => {
            const mockFile = {
                buffer: Buffer.from('test-image-data'),
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            const mockUploadStream = jest.fn((options, callback) => {
                setTimeout(() => callback(null, { secure_url: 'https://test.com/image.jpg' }), 0);
                return {
                    on: jest.fn(),
                    end: jest.fn(),
                };
            });

            (cloudinary.uploader.upload_stream as jest.Mock) = mockUploadStream;

            const mockReadStream = {
                pipe: jest.fn().mockReturnThis(),
            };
            (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

            await service.uploadFile(mockFile);

            // Verify transformations are applied
            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                expect.objectContaining({
                    transformation: [
                        { width: 500, height: 500, crop: 'limit' }, // Resize to max 500x500
                        { quality: 'auto' }, // Auto quality optimization
                        { fetch_format: 'auto' }, // Auto format (WebP when supported)
                    ],
                }),
                expect.any(Function)
            );
        });
    });
});
