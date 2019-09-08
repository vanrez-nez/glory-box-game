const DefaultMood = {
  Engine: {
    Low: {
      Scene: {
        FogColor: 0x070011,
        FogDensity: 0.0022,
      },
      ToneMapping: {
        Exposure: 1.5,
      },
      AmbientLight: {
        Color: 0xbdd5f7,
        Intensity: 0.65,
      },
    },
    Medium: {
      Scene: {
        FogColor: 0x070011,
        FogDensity: 0.0022,
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
        FogDensity: 0.0022,
      },
      ToneMapping: {
        Exposure: 1.4,
      },
      AmbientLight: {
        Color: 0xbdd5f7,
        Intensity: 0.25,
      },
      BloomPass: {
        Strength: 1.7,
        Threshold: 0.37,
        Radius: 1.35,
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
        color: 0xf48080,
        lineWidth: 3,
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
        color: 0x2d2030,
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
        emissiveIntensity: 1.4286810376324442,
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
        color: 13164543,
        emissive: 65535,
        emissiveIntensity: 0.6501686355844346,
        metalness: 0.6267811472415052,
        roughness: 0.27603215199123127,
        envMapIntensity: 1.3470953598830837,
        refractionRatio: 0.7086225794665693,
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
        color: 0xf48080,
        lineWidth: 3,
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
      player_main: {
        color: 0xfff4ce,
        reflectivity: 0.6531774281574114,
      },
      player_particle: {
        color: 0xfff4ce,
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
        color: 0xb6608e,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.76,
        roughness: 0.1,
        envMapIntensity: 0.92,
        refractionRatio: 0.98,
      },
      w_main_cylinder: {
        color: 0x655368,
        emissive: 6901616,
        emissiveIntensity: 0.7437750165535473,
        metalness: 1,
        roughness: 1,
        envMapIntensity: 1.8,
        refractionRatio: 0.8723054439166971,
      },
      w_fx_cylinder: {
        opacity: 1,
      },
      w_base_cylinder: {
        color: 13164543,
        emissive: 65535,
        emissiveIntensity: 0.7437750165535473,
        metalness: 0.6267811472415052,
        roughness: 0.27603215199123127,
        envMapIntensity: 1.3470953598830837,
        refractionRatio: 0.7086225794665693,
      },
      w_skyc: {
        color: 0x3e29c4,
        fade: 1.79,
        zoom: 1.7,
        stepSize: 0.25,
        tile: 0.65,
        intensity: 0.01,
        transverseSpeed: 1.1672277539372298,
      },
      ph_trail: {
        color: 3140095,
        lineWidth: 0.2,
      },
      ph_fireball: {
        fissuresColor: 16744192,
        fissuresIntensity: 1.6,
        glowColor: 3140095,
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
        color: 16023680,
        lineWidth: 3,
      },
      plt_steps: {
        color: 0x6a3f6b,
        emissive: 0,
        emissiveIntensity: 1,
        metalness: 0.3,
        roughness: 0.96,
        envMapIntensity: 2,
        refractionRatio: 0,
      },
      plt_socket: {
        color: 0x2d2030,
      },
      plt_socket_light: {
        color: 0x311d32,
      },
      plt_static: {
        color: 13716082,
        reflectivity: 1,
      },
      collect_glyph_6: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.4145367682805213,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_item_6: {
        color: 16731983,
        reflectivity: 1,
      },
      collect_trail_6: {
        color: 16731983,
        lineWidth: 0.3,
      },
      collect_glyph_8: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.49387783903526455,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      plt_dynamic: {
        color: 6129107,
        reflectivity: 1,
      },
      collect_glyph_0: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.32466990328094286,
        reflectivity: 0.5,
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
      cl_socket: {
        color: 0xe2b8fc,
        emissive: 0,
        emissiveIntensity: 1,
        reflectivity: 0.54,
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
      collect_glyph_5: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.5160725927598924,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
      collect_glyph_3: {
        color: 592913,
        emissive: 16747567,
        emissiveIntensity: 3.5391709655962833,
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
      collect_glyph_7: {
        color: 592913,
        emissive: 2171169,
        emissiveIntensity: 0.414575482291875,
        reflectivity: 0.5,
        refractionRatio: 0.98,
      },
    },
  },
};

export default DefaultMood;
