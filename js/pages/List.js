import { store } from "../main.js";
import { embed, getFontColour } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {     
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
            <div class="search-bar">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search levels..."
                class="search-input"
                />
            </div>
                <table class="list" v-if="Array.isArray(filteredList) && filteredList.length">
                    <tr v-for="([level, err, originalIndex], i) in filteredList" :key="i">
                       <td class="rank">
                          <p v-if="!searchQuery && i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                          <p v-else-if="!searchQuery" class="type-label-lg">Legacy</p>
                       </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button class="btngl" @click="selected = originalIndex">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <div class="packs" v-if="level.packs.length > 0">
                        <div v-for="pack in level.packs" class="tag" :style="{background:pack.colour}">
                            <p>{{pack.name}}</p>
                        </div>
                    </div>
                    <div v-if="level.showcase" class="tabs">
                        <button class="btn" :class="{selected: !toggledShowcase}" @click="toggledShowcase = false">
                            <span class="type-label-lg">Verification</span>
                        </button>
                        <button class="btn" :class="{selected: toggledShowcase}" @click="toggledShowcase = true">
                            <span class="type-label-lg">Showcase</span>
                        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points</div>
                            <p v-if="selected + 1 <= 75">{{ score(selected + 1, level.percentToQualify, level.percentToQualify) }} (100% = {{ score(selected + 1, 100, level.percentToQualify) }})</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free copy' }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Difficulty</div>
                            <p>{{ level.difficulty || 'NA' }}</p>
                        </li>
                    </ul>
                    <h2>Record</h2>
                    <p class="extended"><b>{{ level.records.length }}</b> records registered</p>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>You may send a record for this level, but no list points will be awarded.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p v-if="record.percent == 100"><b>{{ record.percent }}%</b></p>
                                <p v-else>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="legacy">
                                <img v-if="record.legacy" :src="\`/assets/legacy.svg\`" alt="Legacy" title="Legacy Record">
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>Asu rusak</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="dark-bg">
                    <h2>Changelog:</h2>
                    <br>
                    <p class="extended">...</p>
                    <br><br>
                    <p>No changes have been made yet</p>
                    </div>
                    <div class="dark-bg">
                    <h2>Rules</h2>
                    <br>
                    <p>Every action is conducted in accordance with our guidelines. In order to guarantee a consistent experience, make sure to verify them before submitting a record!</p>
                    <br><br>
                    <a class="btngl" href="/extended-page/rules.html">Guidelines</a>
                    <br><br><br>
                    <a class="btngl" href="/extended-page/faq.html">List Placement</a>
                    <br><br><br>
                    <a class="btngl" href="https://forms.gle/MecxM26YLrSMobai9">Send Record</a>
                    </div>
                    <div class="dark-bg" v-if="editors">
                        <h3>List Staff:</h3>
                        <br>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </div>
                    <div class="og">
                        <iframe class="discord-box" src="https://discord.com/widget?id=1303563415066902619&theme=dark" width="270" height="300" allowtransparency="false" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
                    </div>
                    <div class="og" class="dark-bg">
                        <p>All credits goes to <a href="https://tsl.pages.dev/#/" target="_blank">TSL</a> for the website and <a href="https://tgdps-dl.pages.dev/#/" target="_blank">TGDPS Demonlist</a> for more features inspiration. This doesn't have any connection/affiliation with TSL. Original list by <a href="https://me.redlimerl.com/" target="_blank">RedLime</a></p>
                    </div>
                    <button class="btngl" @click="selected = 0">#1 Demon</button>
                    <button class="btngl" @click="selected = 75">Extended</button>
                    <button class="btngl" @click="selected = 150">Legacy</button>
                </div>
            </div>
         </template>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        toggledShowcase: false,
        searchQuery: "",
    }),
    computed: {
  level() {
    return this.list[this.selected]?.[0];
  },
  video() {
    if (!this.level?.showcase) {
      return embed(this.level.verification);
    }
    return embed(
      this.toggledShowcase
        ? this.level.showcase
        : this.level.verification
    );
  },
  filteredList() {
  if (!Array.isArray(this.list)) return [];
  if (!this.searchQuery) {
    // include index when search is empty
    return this.list.map((item, i) => [item[0], item[1], i]);
  }

  const q = this.searchQuery.toLowerCase();
  return this.list
    .map(([level, err], i) => [level, err, i])
    .filter(([level]) => level && level.name.toLowerCase().includes(q));
},
},
    async mounted() {
        store.list = this;
        await resetList();
    },
    methods: {
        embed, 
        score,
    },
};
export async function resetList() {
    console.log("resetting");

    store.list.loading = true;

    // Load data
    store.list.list = await fetchList();
    store.list.editors = await fetchEditors();

    // Error handling
    if (!store.list.list) {
        store.list.errors = [
            "Failed to load list. Retry in a few minutes or notify list staff.",
        ];
    } else {
        store.list.errors.push(
            ...store.list.list
                .filter(([_, err]) => err)
                .map(([_, err]) => `Failed to load level. (${err}.json)`)
        );
        if (!store.list.editors) {
            store.list.errors.push("Failed to load list editors.");
        }
    }

    store.list.loading = false;
}
