import { getImmichAssets, uploadImmichAsset } from './app/actions/immich'
import { getPhotoTags } from './app/actions/photos'

async function runTest() {
    try {
        console.log("Fetching tags...")
        const tags = await getPhotoTags()
        console.log("Tags:", tags)

        console.log("Fetching assets with no tag filter...")
        const assets = await getImmichAssets()
        console.log("Total assets:", assets.length)
        if (assets.length > 0) {
            console.log("First asset name:", assets[0].originalFileName)
            console.log("First asset tags:", assets[0].tags)
        }

        // Find the specific image the subagent uploaded ('banner-test')
        const bannerAsset = assets.find(a => a.originalFileName.includes('banner-test'))
        if (bannerAsset) {
            console.log("Found banner-test asset. Tags:", bannerAsset.tags)
        } else {
            console.log("Could not find banner-test asset.")
        }
    } catch (err) {
        console.error("Test failed:", err)
    }
}

runTest()
