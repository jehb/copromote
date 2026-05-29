const immichMock = {
    deleteAssets: jest.fn().mockResolvedValue({}),
    uploadAsset: jest.fn().mockResolvedValue({ id: 'immich-1' }),
    addTag: jest.fn().mockResolvedValue({})
}

module.exports = {
    ImmichApi: jest.fn().mockImplementation(() => immichMock),
    __esModule: true,
    default: immichMock
};
