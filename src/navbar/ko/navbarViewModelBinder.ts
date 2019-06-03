import { NavbarViewModel } from "./navbarViewModel";
import { NavbarItemViewModel } from "./navbarItemViewModel";
import { ViewModelBinder } from "@paperbits/common/widgets";
import { IEventManager } from "@paperbits/common/events";
import { NavigationItemContract, NavigationItemModel, NavigationEvents } from "@paperbits/common/navigation";
import { NavbarModel } from "../navbarModel";
import { NavbarModelBinder } from "../navbarModelBinder";
import { IStyleCompiler } from "@paperbits/common/styles/IStyleCompiler";
import { Bag } from "@paperbits/common";


export class NavbarViewModelBinder implements ViewModelBinder<NavbarModel, NavbarViewModel> {
    constructor(
        private readonly eventManager: IEventManager,
        private readonly navbarModelBinder: NavbarModelBinder,
        private readonly styleCompiler: IStyleCompiler
    ) { }

    private navbarItemModelToNavbarItemViewModel(navbarItemModel: NavigationItemModel): NavbarItemViewModel {
        const label = navbarItemModel.label;
        const navbarItemViewModel = new NavbarItemViewModel(label);

        if (navbarItemModel.nodes.length > 0) {
            const results = navbarItemModel.nodes.map(childNode => this.navbarItemModelToNavbarItemViewModel(childNode));

            results.forEach(child => {
                navbarItemViewModel.nodes.push(child);
            });
        }
        else {
            navbarItemViewModel.url(navbarItemModel.url);
            navbarItemViewModel.isActive(navbarItemModel.isActive);
        }

        return navbarItemViewModel;
    }


    public async modelToViewModel(model: NavbarModel, viewModel?: NavbarViewModel, bindingContext?: Bag<any>): Promise<NavbarViewModel> {
        let onUpdate;

        if (!viewModel) {
            viewModel = new NavbarViewModel();

            onUpdate = async (updatedRootContract: NavigationItemContract): Promise<void> => {
                if (updatedRootContract.key === model.rootKey) {
                    const updatedRootModel = await this.navbarModelBinder.navigationItemToNavbarItemModel(updatedRootContract);
                    viewModel.navigationRoot(this.navbarItemModelToNavbarItemViewModel(updatedRootModel));
                }
            };
        }

        if (model.root) {
            const navigationRoot = this.navbarItemModelToNavbarItemViewModel(model.root);
            viewModel.navigationRoot(navigationRoot);
        }

        viewModel.pictureSourceUrl(model.pictureSourceUrl);
        viewModel.pictureWidth(model.pictureWidth);
        viewModel.pictureHeight(model.pictureHeight);

        if (model.styles) {
            viewModel.styles(await this.styleCompiler.getClassNamesByStyleConfigAsync2(model.styles));
        }

        viewModel["widgetBinding"] = {
            displayName: "Navigation bar",
            readonly: bindingContext ? bindingContext.readonly : false,
            model: model,
            editor: "navbar-editor",
            applyChanges: () => {
                this.modelToViewModel(model, viewModel, bindingContext);
                this.eventManager.dispatchEvent("onContentUpdate");
            },
            onCreate: () => {
                this.eventManager.addEventListener(NavigationEvents.onNavigationItemUpdate, onUpdate);
            },
            onDispose: () => {
                this.eventManager.removeEventListener(NavigationEvents.onNavigationItemUpdate, onUpdate);
            }
        };

        return viewModel;
    }

    public canHandleModel(model: NavbarModel): boolean {
        return model instanceof NavbarModel;
    }
}