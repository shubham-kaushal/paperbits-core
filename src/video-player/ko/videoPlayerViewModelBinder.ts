import { VideoPlayerViewModel } from "./videoPlayerViewModel";
import { ViewModelBinder } from "@paperbits/common/widgets";
import { VideoPlayerModel } from "../videoPlayerModel";
import { IEventManager } from "@paperbits/common/events";
import { IStyleCompiler } from "@paperbits/common/styles/IStyleCompiler";
import { Bag } from "@paperbits/common";
import { IPermalinkResolver } from "@paperbits/common/permalinks";

export class VideoPlayerViewModelBinder implements ViewModelBinder<VideoPlayerModel, VideoPlayerViewModel> {
    constructor(
        private readonly eventManager: IEventManager,
        private readonly styleCompiler: IStyleCompiler,
        private readonly mediaPermalinkResolver: IPermalinkResolver
    ) { }

    public async modelToViewModel(model: VideoPlayerModel, viewModel?: VideoPlayerViewModel, bindingContext?: Bag<any>): Promise<VideoPlayerViewModel> {
        if (!viewModel) {
            viewModel = new VideoPlayerViewModel();
        }

        let sourceUrl = null;

        if (model.sourceKey) {
            sourceUrl = await this.mediaPermalinkResolver.getUrlByTargetKey(model.sourceKey);

            if (!sourceUrl) {
                console.warn(`Unable to set video. Media with source key ${model.sourceKey} not found.`);
            }
        }

        viewModel.sourceUrl(sourceUrl);
        viewModel.controls(model.controls);
        viewModel.autoplay(model.autoplay);

        if (model.styles) {
            viewModel.styles(await this.styleCompiler.getClassNamesByStyleConfigAsync2(model.styles));
        }

        viewModel["widgetBinding"] = {
            displayName: "Video player",
            readonly: bindingContext ? bindingContext.readonly : false,
            model: model,
            editor: "video-player-editor",
            applyChanges: (changes) => {
                Object.assign(model, changes);
                this.modelToViewModel(model, viewModel);
                this.eventManager.dispatchEvent("onContentUpdate");
            }
        };

        return viewModel;
    }

    public canHandleModel(model: VideoPlayerModel): boolean {
        return model instanceof VideoPlayerModel;
    }
}