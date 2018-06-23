const DefaultMood = {
  Engine: {
    Low: {
      Scene: {
        FogColor: 0x070011,
        FogDensity: 0.022,
      },
      ToneMapping: {
        Exposure: 1.5,
      },
    },
    Medium: {
      Scene: {
        FogColor: 0x070011,
        FogDensity: 0.022,
      },
      ToneMapping: {
        Exposure: 1.4,
      },
      AmbientLight: {
        Color: 0xbdd5f7,
        Intensity: 0.65,
      },
    },
    High: {
      Scene: {
        FogColor: 0x070011,
        FogDensity: 0.022,
      },
      ToneMapping: {
        Exposure: 1.4,
      },
      AmbientLight: {
        Color: 0xbdd5f7,
        Intensity: 0.65,
      },
      BloomPass: {
        Strength: 2.07,
        Threshold: 0.54,
        Radius: 1.1,
        HighPassColor: 0x0,
      },
    },
  },
  Materials: {
    Low: {
      explode_trail: {
        color: 16777215,
        lineWidth: 0.7076244550096792,
      },
      enemy_ray: {
        rayColor: 3484866,
        thinDebrisColor: 1922524,
        fatDebrisColor: 8782079,
      },
      w_floor: {
        color: 4148873,
      },
      w_main_cylinder: {
        color: 2569823,
      },
      w_fx_cylinder: {
      },
      w_base_cylinder: {
        color: 2569823,
      },
      ph_trail: {
        color: 16731983,
        lineWidth: 0.25,
      },
      ph_fireball: {
        fissuresColor : 16730880,
        fissuresIntensity : 3.4439461883408073,
        glowColor : 16731983,
        glowIntensity : {
          x : 1.5,
          y : 2.5,
        },
        ringColor : 16725016,
        ringThickness : 0.9780807174887892,
      },
      enemy_head: {
        color: 1397676,
      },
      enemy_eyes: {
        color: 16056363,
      },
      enemy_armor: {
        color: 1658505,
      },
      enemy_col_trail: {
        color: 0xff7800,
        lineWidth: 2,
      },
      plt_steps: {
        color: 986907,
      },
      plt_static: {
        color: 38655,
      },
      collect_glyph_4: {
        color: 592913,
        emissive: 16645935,
        emissiveIntensity: 6,
        refractionRatio: 0.98,
      },
      collect_item_4: {
        color: 16645935,
      },
      collect_trail_4: {
        color: 16645935,
        lineWidth: 0.3,
      },
      collect_glyph_2: {
        color: 592913,
        emissive: 3140095,
      },
      collect_item_2: {
        color: 3140095,
      },
      collect_trail_2: {
        color: 3140095,
        lineWidth: 0.3,
      },
      plt_dynamic: {
        color: 16758608,
      },
      collect_glyph_5: {
        color: 592913,
        emissive: 16731983,
      },
      collect_item_5: {
        color: 16731983,
      },
      collect_trail_5: {
        color: 16731983,
        lineWidth: 0.3,
      },
      collect_glyph_6: {
        color: 592913,
        emissive: 16731983,
      },
      plt_socket: {
        color: 395793,
      },
      cl_socket: {
        color: 461073,
      },
      collect_glyph_1: {
        color: 592913,
        emissive: 15937535,
      },
      collect_item_1: {
        color: 15937535,
      },
      collect_trail_1: {
        color: 15937535,
        lineWidth: 0.3,
      },
      collect_glyph_8: {
        color: 592913,
        emissive: 16731983,
      },
      collect_glyph_0: {
        color: 592913,
        emissive: 16731983,
      },
      collect_glyph_7: {
        color: 592913,
        emissive: 16731983,
      },
      collect_glyph_3: {
        color: 592913,
        emissive: 16747567,
      },
      collect_item_3: {
        color: 16747567,
      },
      collect_trail_3: {
        color: 16747567,
        lineWidth: 0.3,
      },
    },
    Medium: {
      player_main: {
        color: 16777215,
      },
      player_particle: {
        color: 5523605,
      },
      explode_trail: {
        color: 16777215,
      },
      enemy_ray: {
        rayColor: 3172589,
        thinDebrisColor: 1996743,
        fatDebrisColor: 38399,
      },
      w_floor: {
        color: 5928349,
        emissive: 0,
        emissiveIntensity: 1,
        reflectivity: 0.1262780269058296,
        specular: 989005,
        shininess: 0.6887892376681614,
        refractionRatio: 0.98,
      },
      w_main_cylinder: {
        color: 5928349,
        emissive: 42239,
        emissiveIntensity: 0.5286810376324442,
        reflectivity: 0.20588235294117646,
        specular: 9558271,
        shininess: 3.9349652904640116,
        refractionRatio: 1,
      },
      w_fx_cylinder: {
        opacity: 1,
      },
      w_base_cylinder: {
        color: 5928349,
        emissive: 42239,
        emissiveIntensity: 0.762513701132627,
        reflectivity: 0.2175739861161856,
        specular: 9558271,
        shininess: 1.8304713189623676,
        refractionRatio: 0.98,
      },
      w_skyc: {
        color: 795210,
        fade: 0.9413452914798206,
        zoom: 2.341883408071749,
        stepSize: 0.40179372197309415,
        tile: 0.5280717488789237,
        transverseSpeed: 1.331659192825112,
      },
      ph_trail: {
        color: 16747567,
        lineWidth: 0.2,
      },
      ph_fireball: {
        fissuresColor: 16744192,
        fissuresIntensity: 1.6,
        glowColor: 16747567,
        glowIntensity: {
          x: 1.5,
          y: 2.5,
        },
        ringColor: 16737817,
        ringThickness: 0.2,
      },
      enemy_head: {
        color: 8012766,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.8,
        roughness: 0.5,
        envMapIntensity: 1,
        refractionRatio: 0.98,
      },
      enemy_eyes: {
        color: 16777215,
        reflectivity: 1,
      },
      enemy_armor: {
        color: 0x0a494d,
        emissiveIntensity: 0,
        metalness: 0,
        roughness: 1,
        envMapIntensity: 1.5,
        refractionRatio: 0.98,
      },
      enemy_col_trail: {
        color: 0xff7800,
        lineWidth: 2,
      },
      plt_steps: {
        color: 0x111725,
        reflectivity: 0.18,
        refractionRatio: 0.64,
      },
      plt_static: {
        color: 5084616,
        reflectivity: 1,
      },
      collect_glyph_1: {
        color: 592913,
        emissive: 15937535,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_1: {
        color: 15937535,
        reflectivity: 1,
      },
      collect_trail_1: {
        color: 15937535,
        lineWidth: 0.3,
      },
      collect_glyph_4: {
        color: 592913,
        emissive: 16645935,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_4: {
        color: 16645935,
        reflectivity: 1,
      },
      collect_trail_4: {
        color: 16645935,
        lineWidth: 0.3,
      },
      plt_dynamic: {
        color: 11309368,
        reflectivity: 1,
      },
      collect_glyph_8: {
        color: 592913,
        emissive: 16731983,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_8: {
        color: 16731983,
        reflectivity: 1,
      },
      collect_trail_8: {
        color: 16731983,
        lineWidth: 0.3,
      },
      plt_socket: {
        color: 0x0a0f16,
        reflectivity: 1,
      },
      cl_socket: {
        color: 0x1a293e,
        emissive: 0,
        emissiveIntensity: 1,
        reflectivity: 0.35,
        refractionRatio: 0.98,
      },
      collect_glyph_6: {
        color: 592913,
        emissive: 16731983,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_0: {
        color: 592913,
        emissive: 16731983,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_5: {
        color: 592913,
        emissive: 16731983,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_3: {
        color: 592913,
        emissive: 16747567,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_3: {
        color: 16747567,
        reflectivity: 1,
      },
      collect_trail_3: {
        color: 16747567,
        lineWidth: 0.3,
      },
      collect_glyph_2: {
        color: 592913,
        emissive: 3140095,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_2: {
        color: 3140095,
        reflectivity: 1,
      },
      collect_trail_2: {
        color: 3140095,
        lineWidth: 0.3,
      },
      collect_glyph_7: {
        color: 592913,
        emissive: 16731983,
        emissiveIntensity: 6,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
    },
    High: {
      player_particle: {
        color: 5523605,
      },
      explode_trail: {
        color: 16777215,
        lineWidth: 0.7490243425115815,
      },
      enemy_ray: {
        rayColor: 2972098,
        thinDebrisColor: 1996743,
        fatDebrisColor: 38399,
      },
      w_floor: {
        color: 5993883,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.2181165919282511,
        roughness: 0.32143497757847533,
        envMapIntensity: 0.29847533632286993,
        refractionRatio: 0.5395515695067264,
      },
      w_main_cylinder: {
        color: 7770550,
        emissive: 3894728,
        emissiveIntensity: 0.5754475703324808,
        metalness: 0.4864815491413957,
        roughness: 0.15911582024113993,
        envMapIntensity: 0.7858969674826453,
        refractionRatio: 0.8723054439166971,
      },
      w_fx_cylinder: {
        opacity: 1,
      },
      w_base_cylinder: {
        color: 13164543,
        emissive: 65535,
        emissiveIntensity: 0.4585312385823895,
        metalness: 0.6267811472415052,
        roughness: 0.27603215199123127,
        envMapIntensity: 1.3470953598830837,
        refractionRatio: 0.7086225794665693,
      },
      w_skyc: {
        color: 396606,
        fade: 0.780627802690583,
        zoom: 2.0204484304932735,
        stepSize: 0.5969506726457399,
        tile: 0.6428699551569507,
        transverseSpeed: 3.1684304932735428,
      },
      ph_trail: {
        color: 16731983,
        lineWidth: 0.2,
      },
      ph_fireball: {
        fissuresColor: 16744192,
        fissuresIntensity: 1.6,
        glowColor: 16731983,
        glowIntensity: {
          x: 1.5,
          y: 2.5,
        },
        ringColor: 16737817,
        ringThickness: 0.2,
      },
      enemy_head: {
        color: 16777215,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.8,
        roughness: 0.5,
        envMapIntensity: 1,
        refractionRatio: 0.98,
      },
      enemy_eyes: {
        color: 16777215,
        reflectivity: 1,
      },
      enemy_armor: {
        color: 16777215,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.8,
        roughness: 0.5,
        envMapIntensity: 1,
        refractionRatio: 0.98,
      },
      enemy_col_trail: {
        color: 0xff7800,
        lineWidth: 2,
      },
      plt_steps: {
        color: 16777215,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.5,
        roughness: 0.7,
        envMapIntensity: 0.2,
        refractionRatio: 0.98,
      },
      plt_static: {
        color: 2404301,
        reflectivity: 1,
      },
      collect_glyph_0: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.32466990328094286,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_0: {
        color: 16731983,
        reflectivity: 1,
      },
      collect_trail_0: {
        color: 16731983,
        lineWidth: 0.3,
      },
      collect_glyph_3: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.52115099950572,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_3: {
        color: 16747567,
        reflectivity: 1,
      },
      collect_trail_3: {
        color: 16747567,
        lineWidth: 0.3,
      },
      plt_dynamic: {
        color: 16764810,
        reflectivity: 1,
      },
      collect_glyph_6: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.4145367682805213,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_1: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.5321467835098485,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_1: {
        color: 15937535,
        reflectivity: 1,
      },
      collect_trail_1: {
        color: 15937535,
        lineWidth: 0.3,
      },
      plt_socket: {
        color: 593430,
        reflectivity: 1,
      },
      cl_socket: {
        color: 1318189,
        emissive: 0,
        emissiveIntensity: 1,
        reflectivity: 0.35,
        refractionRatio: 0.98,
      },
      collect_glyph_2: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.37222900341845727,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_2: {
        color: 3140095,
        reflectivity: 1,
      },
      collect_trail_2: {
        color: 3140095,
        lineWidth: 0.3,
      },
      collect_glyph_8: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.49387783903526455,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_4: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.39822912380956094,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_4: {
        color: 16645935,
        reflectivity: 1,
      },
      collect_trail_4: {
        color: 16645935,
        lineWidth: 0.3,
      },
      collect_glyph_7: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.414575482291875,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_5: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.5160725927598924,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
    },
  },
};

export default DefaultMood;
