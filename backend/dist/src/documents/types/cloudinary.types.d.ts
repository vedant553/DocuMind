export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    bytes: number;
    format: string;
    resource_type: string;
    created_at: string;
}
export interface DocumentUploadResponse {
    success: boolean;
    document: {
        id: number;
        name: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
        status: string;
        createdAt: Date;
    };
    message: string;
}
