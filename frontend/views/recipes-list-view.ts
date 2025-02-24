import "@vaadin/checkbox";
import "@vaadin/checkbox-group";
import "@vaadin/details";
import { Details } from "@vaadin/details";
import "@vaadin/text-field";
import { capitalCase } from "change-case";
import { replaceQueryParameter } from "Frontend/util";
import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { debounce } from "ts-debounce";
import { recipes } from "../";
import RecipeInfo from "../generated/com/vaadin/recipes/data/RecipeInfo";
import Tag from "../generated/com/vaadin/recipes/recipe/Tag";

@customElement("recipes-list-view")
export class RecipesListView extends LitElement {
  @property({ type: String })
  filter: string = "";
  @property({ type: Array })
  filterTags: Tag[] = [];

  tags = Tag;

  constructor() {
    super();
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");
    if (searchParam && searchParam.length > 1) {
      this.filter = searchParam;
    }
  }
  firstUpdated() {
    const details = this.querySelector(".tag-filter") as Details;
    details.opened = window.matchMedia("(min-width: 600px)").matches;
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        recipes-list-view {
          display: block;
          --recipes-filter-column-width: 200px;
          --recipes-list-view-header-height: 80px;
          background-color: var(--color-alloy-lighter);
        }

        .recipes-list-view-header {
          background-color: var(--color-white);
          position: -webkit-sticky;
          position: sticky;
          top: 0;
          height: var(--recipes-list-view-header-height);
        }

        .recipes-list-view-header > .container-fluid {
          min-height: calc(var(--space-lg));
          padding-top: var(--space-sm);
          padding-bottom: var(--space-sm);
          display: flex;
          align-items: center;
        }

        .recipes-list-view-header .title {
          width: var(--recipes-filter-column-width);
          flex: none;
          margin: 0;
          padding: 0;
        }

        .recipes-list-view-header-search {
          flex: auto;
        }

        .recipes-list-view-header-search input {
          border: 0 !important;
          background: transparent !important;
        }

        .recipes-list-view-header-search i.las {
          font-size: 1.25em;
          color: var(--color-graphite);
        }

        .recipes-list-view-header-links {
          margin-left: var(--space-lg);
        }

        .recipes-list-view-header-links a {
          font-weight: 600;
          text-decoration: none !important;
        }

        .recipes-list-container {
          display: flex;
          align-items: flex-start;
          padding-top: var(--space-md);
          padding-bottom: var(--space-xl);
        }

        .recipes-list-tags {
          width: var(--recipes-filter-column-width);
          box-sizing: border-box;
          flex: none;
          position: -webkit-sticky;
          position: sticky;
          top: var(--recipes-list-view-header-height);
          background-color: var(--color-alloy-lighter);
          max-height: calc(100vh - var(--recipes-list-view-header-height));
          overflow: auto;
          padding: var(--space-xs) 0;
          padding-right: var(--space-md);
        }

        .recipes-list-tags vaadin-details {
          margin: 0;
        }

        .recipes-list-tags h6 {
          margin: 0;
          padding: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recipes-list-tags .selected-tags {
          font-weight: var(--text-weight-regular);
        }

        .recipes-list-tags vaadin-details[opened] .selected-tags {
          display: none;
        }

        .recipes-list-tags vaadin-checkbox-group,
        .recipes-list-tags vaadin-checkbox {
          font-family: inherit;
          font-size: var(--text-size-sm);
          color: var(--color-graphite);
          width: 100%;
        }

        .recipes-list-tags vaadin-checkbox {
          display: block;
        }

        .recipes-list-tags vaadin-checkbox .tag {
          float: right;
        }

        .recipes-list-tags vaadin-checkbox .tag-count {
          font-weight: 700;
          font-size: var(--text-size-xs);
          color: var(--color-stainless-darker);
        }

        .recipes-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .recipe-tags {
          cursor: pointer;
        }

        .recipe-title {
          margin-top: var(--space-md);
          margin-bottom: 0;
        }

        .recipe:first-child .recipe-title {
          margin-top: var(--space-xs);
        }

        p.recipe-description {
          margin-bottom: 0;
        }

        .recipe a {
          color: inherit;
          text-decoration: none;
        }

        @media (max-width: 600px) {
          recipes-list-view {
            --recipes-filter-column-width: auto;
            --recipes-list-view-header-height: 118px;
          }

          .recipes-list-view-header > .container-fluid {
            flex-wrap: wrap;
          }

          .recipes-list-view-header-search {
            order: 1;
            margin-top: var(--space-xs);
            min-width: 50vw;
          }

          .recipes-list-view-header-links {
            margin-left: auto;
          }

          .recipes-list-tags {
            padding-right: 0;
            border-bottom: 1px solid var(--color-alloy-darker);
            margin-bottom: var(--space-md);
          }

          .recipes-list-container {
            flex-direction: column;
            align-items: stretch;
            padding-top: 0;
          }
        }
      </style>

      <div class="recipes-list-view-header">
        <div class="container-fluid">
          <h4 class="title">Cookbook</h4>

          <vaadin-text-field
            clear-button-visible
            @value-changed="${this.updateFilter}"
            placeholder="How do I..."
            theme="vcom"
            value=${this.filter}
            class="recipes-list-view-header-search form-field"
          >
            <i class="las la-search" aria-hidden="true" slot="prefix"></i>
          </vaadin-text-field>

          <div class="recipes-list-view-header-links">
            <a
              href="https://github.com/vaadin/cookbook#vaadin-cookbook"
              class="link-with-arrow"
            >
              <span>Submit a recipe</span>
              <div class="icon-wrapper">
                <i class="las la-arrow-right" aria-hidden="true"></i>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div class="recipes-list-container container-fluid">
        <div class="recipes-list-tags">
          <vaadin-details theme="reverse cookbook" opened class="tag-filter">
            <h6 slot="summary">
              Filter<span class="selected-tags">
                ${this.filterTags.length > 0 ? ": " : ""}
                ${this.filterTags.map(this.tagToHumanReadable).join(", ")}
              </span>
            </h6>
            <vaadin-checkbox-group @value-changed=${this.tagFilterChange}>
              ${Object.values(this.tags).map(
                (tag) => html`
                  <vaadin-checkbox
                    value="${tag}"
                    ?checked=${this.filterTags.includes(tag)}
                    theme="cookbook"
                    >${this.tagToHumanReadable(tag)}
                    <span
                      class="tag-count"
                      ?hidden=${this.matchCount(tag) === 0}
                      >${this.matchCount(tag)}</span
                    ></vaadin-checkbox
                  >
                `
              )}
            </vaadin-checkbox-group>
          </vaadin-details>
        </div>
        <ul class="recipes-list">
          ${repeat(
            recipes.filter((recipe) =>
              this.recipeMatches(recipe, this.filter, this.filterTags)
            ),
            (recipe) => recipe.url,
            (recipe) =>
              html` <li class="recipe">
                <h5 class="recipe-title">
                  <a href="${recipe.url}"
                    >${recipe.howDoI
                      .trim()
                      .replace(/^\w/, (c) => c.toUpperCase())}</a
                  >
                </h5>
                <p
                  class="paragraph-sm recipe-description"
                  ?hidden=${recipe.description?.length === 0}
                >
                  ${recipe.description}
                </p>
                <div class="recipe-tags tag-group">
                  ${recipe.tags?.map(
                    (tag) =>
                      html`<span
                        class="tag water"
                        @click="${() => this.setFilterTag(tag)}"
                        >${this.tagToHumanReadable(tag)}</span
                      > `
                  )}
                </div>
              </li>`
          )}
        </ul>
      </div>
    `;
  }
  tagToHumanReadable(tag: Tag): string {
    return capitalCase(tag).replace(/ /g, "");
  }
  matchCount(tag: Tag): number {
    return recipes.filter((recipe) =>
      this.recipeMatches(recipe, this.filter, [...this.filterTags, tag])
    ).length;
  }

  setFilterTag(tag: Tag) {
    this.filterTags = [tag];
  }

  recipeMatches(
    recipe: RecipeInfo,
    filter: string,
    filterTags: Tag[]
  ): boolean {
    const summary = recipe.howDoI.toLowerCase();
    const description = (recipe.description || "").toLowerCase();
    if (!summary.includes(filter) && !description.includes(filter)) {
      return false;
    }
    return this.recipeHasTags(recipe, filterTags);
  }

  tagFilterChange(e: CustomEvent) {
    this.filterTags = e.detail.value;
  }

  logSearch() {
    if (!this.filter) return;

    if ("haas" in window) {
      //@ts-ignore
      window.haas.tracker.gtm.triggerGAEvent(
        "send",
        "event",
        "cookbook",
        "search",
        this.filter
      );
    } else {
      console.log(`Search event: "${this.filter}". GA disabled locally.`);
    }
  }

  private debouncedLog = debounce(this.logSearch, 1000);

  updateFilter(e: CustomEvent) {
    const value = e.detail.value;
    this.filter = value.toLowerCase();

    replaceQueryParameter("search",this.filter);
    this.debouncedLog();
  }

  recipeHasTags(recipe: RecipeInfo, tags: Tag[]) {
    for (const includeTag of tags) {
      if (!recipe.tags?.includes(includeTag)) {
        return false;
      }
    }
    return true;
  }
}
