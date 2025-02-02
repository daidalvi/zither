! function () {
    "use strict";
    var e = function () {
        this.init()
    };
    e.prototype = {
        init: function () {
            var e = this || n;
            return e._counter = 1e3, e._codecs = {}, e._howls = [], e._muted = !1, e._volume = 1, e._canPlayEvent = "canplaythrough", e._navigator = "undefined" != typeof window && window.navigator ? window.navigator : null, e.masterGain = null, e.noAudio = !1, e.usingWebAudio = !0, e.autoSuspend = !0, e.ctx = null, e.mobileAutoEnable = !0, e._setup(), e
        },
        volume: function (e) {
            var o = this || n;
            if (e = parseFloat(e), o.ctx || _(), void 0 !== e && e >= 0 && 1 >= e) {
                if (o._volume = e, o._muted) return o;
                o.usingWebAudio && (o.masterGain.gain.value = e);
                for (var t = 0; t < o._howls.length; t++)
                    if (!o._howls[t]._webAudio)
                        for (var r = o._howls[t]._getSoundIds(), a = 0; a < r.length; a++) {
                            var u = o._howls[t]._soundById(r[a]);
                            u && u._node && (u._node.volume = u._volume * e)
                        }
                return o
            }
            return o._volume
        },
        mute: function (e) {
            var o = this || n;
            o.ctx || _(), o._muted = e, o.usingWebAudio && (o.masterGain.gain.value = e ? 0 : o._volume);
            for (var t = 0; t < o._howls.length; t++)
                if (!o._howls[t]._webAudio)
                    for (var r = o._howls[t]._getSoundIds(), a = 0; a < r.length; a++) {
                        var u = o._howls[t]._soundById(r[a]);
                        u && u._node && (u._node.muted = !!e || u._muted)
                    }
            return o
        },
        unload: function () {
            for (var e = this || n, o = e._howls.length - 1; o >= 0; o--) e._howls[o].unload();
            return e.usingWebAudio && e.ctx && void 0 !== e.ctx.close && (e.ctx.close(), e.ctx = null, _()), e
        },
        codecs: function (e) {
            return (this || n)._codecs[e.replace(/^x-/, "")]
        },
        _setup: function () {
            var e = this || n;
            if (e.state = e.ctx ? e.ctx.state || "running" : "running", e._autoSuspend(), !e.usingWebAudio)
                if ("undefined" != typeof Audio) try {
                    var o = new Audio;
                    void 0 === o.oncanplaythrough && (e._canPlayEvent = "canplay")
                } catch (n) {
                    e.noAudio = !0
                } else e.noAudio = !0;
            try {
                var o = new Audio;
                o.muted && (e.noAudio = !0)
            } catch (e) {}
            return e.noAudio || e._setupCodecs(), e
        },
        _setupCodecs: function () {
            var e = this || n,
                o = null;
            try {
                o = "undefined" != typeof Audio ? new Audio : null
            } catch (n) {
                return e
            }
            if (!o || "function" != typeof o.canPlayType) return e;
            var t = o.canPlayType("audio/mpeg;").replace(/^no$/, ""),
                r = e._navigator && e._navigator.userAgent.match(/OPR\/([0-6].)/g),
                a = r && parseInt(r[0].split("/")[1], 10) < 33;
            return e._codecs = {
                mp3: !(a || !t && !o.canPlayType("audio/mp3;").replace(/^no$/, "")),
                mpeg: !!t,
                opus: !!o.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/, ""),
                ogg: !!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
                oga: !!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, ""),
                wav: !!o.canPlayType('audio/wav; codecs="1"').replace(/^no$/, ""),
                aac: !!o.canPlayType("audio/aac;").replace(/^no$/, ""),
                caf: !!o.canPlayType("audio/x-caf;").replace(/^no$/, ""),
                m4a: !!(o.canPlayType("audio/x-m4a;") || o.canPlayType("audio/m4a;") || o.canPlayType("audio/aac;")).replace(/^no$/, ""),
                mp4: !!(o.canPlayType("audio/x-mp4;") || o.canPlayType("audio/mp4;") || o.canPlayType("audio/aac;")).replace(/^no$/, ""),
                weba: !!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ""),
                webm: !!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/, ""),
                dolby: !!o.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/, ""),
                flac: !!(o.canPlayType("audio/x-flac;") || o.canPlayType("audio/flac;")).replace(/^no$/, "")
            }, e
        },
        _enableMobileAudio: function () {
            var e = this || n,
                o = /iPhone|iPad|iPod|Android|BlackBerry|BB10|Silk|Mobi/i.test(e._navigator && e._navigator.userAgent),
                t = !!("ontouchend" in window || e._navigator && e._navigator.maxTouchPoints > 0 || e._navigator && e._navigator.msMaxTouchPoints > 0);
            if (!e._mobileEnabled && e.ctx && (o || t)) {
                e._mobileEnabled = !1, e._mobileUnloaded || 44100 === e.ctx.sampleRate || (e._mobileUnloaded = !0, e.unload()), e._scratchBuffer = e.ctx.createBuffer(1, 1, 22050);
                var r = function () {
                    n._autoResume();
                    var o = e.ctx.createBufferSource();
                    o.buffer = e._scratchBuffer, o.connect(e.ctx.destination), void 0 === o.start ? o.noteOn(0) : o.start(0), "function" == typeof e.ctx.resume && e.ctx.resume(), o.onended = function () {
                        o.disconnect(0), e._mobileEnabled = !0, e.mobileAutoEnable = !1, document.removeEventListener("touchstart", r, !0), document.removeEventListener("touchend", r, !0)
                    }
                };
                return document.addEventListener("touchstart", r, !0), document.addEventListener("touchend", r, !0), e
            }
        },
        _autoSuspend: function () {
            var e = this;
            if (e.autoSuspend && e.ctx && void 0 !== e.ctx.suspend && n.usingWebAudio) {
                for (var o = 0; o < e._howls.length; o++)
                    if (e._howls[o]._webAudio)
                        for (var t = 0; t < e._howls[o]._sounds.length; t++)
                            if (!e._howls[o]._sounds[t]._paused) return e;
                return e._suspendTimer && clearTimeout(e._suspendTimer), e._suspendTimer = setTimeout(function () {
                    e.autoSuspend && (e._suspendTimer = null, e.state = "suspending", e.ctx.suspend().then(function () {
                        e.state = "suspended", e._resumeAfterSuspend && (delete e._resumeAfterSuspend, e._autoResume())
                    }))
                }, 3e4), e
            }
        },
        _autoResume: function () {
            var e = this;
            return e.ctx && void 0 !== e.ctx.resume && n.usingWebAudio ? ("running" === e.state && e._suspendTimer ? (clearTimeout(e._suspendTimer), e._suspendTimer = null) : "suspended" === e.state ? (e.ctx.resume().then(function () {
                e.state = "running";
                for (var n = 0; n < e._howls.length; n++) e._howls[n]._emit("resume")
            }), e._suspendTimer && (clearTimeout(e._suspendTimer), e._suspendTimer = null)) : "suspending" === e.state && (e._resumeAfterSuspend = !0), e) : void 0
        }
    };
    var n = new e,
        o = function (e) {
            var n = this;
            return e.src && 0 !== e.src.length ? void n.init(e) : void console.error("An array of source files must be passed with any new Howl.")
        };
    o.prototype = {
        init: function (e) {
            var o = this;
            return n.ctx || _(), o._autoplay = e.autoplay || !1, o._format = "string" != typeof e.format ? e.format : [e.format], o._html5 = e.html5 || !1, o._muted = e.mute || !1, o._loop = e.loop || !1, o._pool = e.pool || 5, o._preload = "boolean" != typeof e.preload || e.preload, o._rate = e.rate || 1, o._sprite = e.sprite || {}, o._src = "string" != typeof e.src ? e.src : [e.src], o._volume = void 0 !== e.volume ? e.volume : 1, o._xhrWithCredentials = e.xhrWithCredentials || !1, o._duration = 0, o._state = "unloaded", o._sounds = [], o._endTimers = {}, o._queue = [], o._onend = e.onend ? [{
                fn: e.onend
            }] : [], o._onfade = e.onfade ? [{
                fn: e.onfade
            }] : [], o._onload = e.onload ? [{
                fn: e.onload
            }] : [], o._onloaderror = e.onloaderror ? [{
                fn: e.onloaderror
            }] : [], o._onplayerror = e.onplayerror ? [{
                fn: e.onplayerror
            }] : [], o._onpause = e.onpause ? [{
                fn: e.onpause
            }] : [], o._onplay = e.onplay ? [{
                fn: e.onplay
            }] : [], o._onstop = e.onstop ? [{
                fn: e.onstop
            }] : [], o._onmute = e.onmute ? [{
                fn: e.onmute
            }] : [], o._onvolume = e.onvolume ? [{
                fn: e.onvolume
            }] : [], o._onrate = e.onrate ? [{
                fn: e.onrate
            }] : [], o._onseek = e.onseek ? [{
                fn: e.onseek
            }] : [], o._onresume = [], o._webAudio = n.usingWebAudio && !o._html5, void 0 !== n.ctx && n.ctx && n.mobileAutoEnable && n._enableMobileAudio(), n._howls.push(o), o._autoplay && o._queue.push({
                event: "play",
                action: function () {
                    o.play()
                }
            }), o._preload && o.load(), o
        },
        load: function () {
            var e = this,
                o = null;
            if (n.noAudio) return void e._emit("loaderror", null, "No audio support.");
            "string" == typeof e._src && (e._src = [e._src]);
            for (var r = 0; r < e._src.length; r++) {
                var u, i;
                if (e._format && e._format[r]) u = e._format[r];
                else {
                    if ("string" != typeof (i = e._src[r])) {
                        e._emit("loaderror", null, "Non-string found in selected audio sources - ignoring.");
                        continue
                    }
                    u = /^data:audio\/([^;,]+);/i.exec(i), u || (u = /\.([^.]+)$/.exec(i.split("?", 1)[0])), u && (u = u[1].toLowerCase())
                }
                if (u || console.warn('No file extension was found. Consider using the "format" property or specify an extension.'), u && n.codecs(u)) {
                    o = e._src[r];
                    break
                }
            }
            return o ? (e._src = o, e._state = "loading", "https:" === window.location.protocol && "http:" === o.slice(0, 5) && (e._html5 = !0, e._webAudio = !1), new t(e), e._webAudio && a(e), e) : void e._emit("loaderror", null, "No codec support for selected audio sources.")
        },
        play: function (e, o) {
            var t = this,
                r = null;
            if ("number" == typeof e) r = e, e = null;
            else {
                if ("string" == typeof e && "loaded" === t._state && !t._sprite[e]) return null;
                if (void 0 === e) {
                    e = "__default";
                    for (var a = 0, u = 0; u < t._sounds.length; u++) t._sounds[u]._paused && !t._sounds[u]._ended && (a++, r = t._sounds[u]._id);
                    1 === a ? e = null : r = null
                }
            }
            var i = r ? t._soundById(r) : t._inactiveSound();
            if (!i) return null;
            if (r && !e && (e = i._sprite || "__default"), "loaded" !== t._state) {
                i._sprite = e, i._ended = !1;
                var d = i._id;
                return t._queue.push({
                    event: "play",
                    action: function () {
                        t.play(d)
                    }
                }), d
            }
            if (r && !i._paused) return o || setTimeout(function () {
                t._emit("play", i._id)
            }, 0), i._id;
            t._webAudio && n._autoResume();
            var _ = Math.max(0, i._seek > 0 ? i._seek : t._sprite[e][0] / 1e3),
                s = Math.max(0, (t._sprite[e][0] + t._sprite[e][1]) / 1e3 - _),
                l = 1e3 * s / Math.abs(i._rate);
            i._paused = !1, i._ended = !1, i._sprite = e, i._seek = _, i._start = t._sprite[e][0] / 1e3, i._stop = (t._sprite[e][0] + t._sprite[e][1]) / 1e3, i._loop = !(!i._loop && !t._sprite[e][2]);
            var c = i._node;
            if (t._webAudio) {
                var f = function () {
                    t._refreshBuffer(i);
                    var e = i._muted || t._muted ? 0 : i._volume;
                    c.gain.setValueAtTime(e, n.ctx.currentTime), i._playStart = n.ctx.currentTime, void 0 === c.bufferSource.start ? i._loop ? c.bufferSource.noteGrainOn(0, _, 86400) : c.bufferSource.noteGrainOn(0, _, s) : i._loop ? c.bufferSource.start(0, _, 86400) : c.bufferSource.start(0, _, s), l !== 1 / 0 && (t._endTimers[i._id] = setTimeout(t._ended.bind(t, i), l)), o || setTimeout(function () {
                        t._emit("play", i._id)
                    }, 0)
                };
                "running" === n.state ? f() : (t.once("resume", f), t._clearTimer(i._id))
            } else {
                var p = function () {
                        c.currentTime = _, c.muted = i._muted || t._muted || n._muted || c.muted, c.volume = i._volume * n.volume(), c.playbackRate = i._rate;
                        try {
                            if (c.play(), c.paused) return void t._emit("playerror", i._id, "Playback was unable to start. This is most commonly an issue on mobile devices where playback was not within a user interaction.");
                            l !== 1 / 0 && (t._endTimers[i._id] = setTimeout(t._ended.bind(t, i), l)), o || t._emit("play", i._id)
                        } catch (e) {
                            t._emit("playerror", i._id, e)
                        }
                    },
                    v = window && window.ejecta || !c.readyState && n._navigator.isCocoonJS;
                if (4 === c.readyState || v) p();
                else {
                    var m = function () {
                        p(), c.removeEventListener(n._canPlayEvent, m, !1)
                    };
                    c.addEventListener(n._canPlayEvent, m, !1), t._clearTimer(i._id)
                }
            }
            return i._id
        },
        pause: function (e) {
            var n = this;
            if ("loaded" !== n._state) return n._queue.push({
                event: "pause",
                action: function () {
                    n.pause(e)
                }
            }), n;
            for (var o = n._getSoundIds(e), t = 0; t < o.length; t++) {
                n._clearTimer(o[t]);
                var r = n._soundById(o[t]);
                if (r && !r._paused && (r._seek = n.seek(o[t]), r._rateSeek = 0, r._paused = !0, n._stopFade(o[t]), r._node))
                    if (n._webAudio) {
                        if (!r._node.bufferSource) continue;
                        void 0 === r._node.bufferSource.stop ? r._node.bufferSource.noteOff(0) : r._node.bufferSource.stop(0), n._cleanBuffer(r._node)
                    } else isNaN(r._node.duration) && r._node.duration !== 1 / 0 || r._node.pause();
                arguments[1] || n._emit("pause", r ? r._id : null)
            }
            return n
        },
        stop: function (e, n) {
            var o = this;
            if ("loaded" !== o._state) return o._queue.push({
                event: "stop",
                action: function () {
                    o.stop(e)
                }
            }), o;
            for (var t = o._getSoundIds(e), r = 0; r < t.length; r++) {
                o._clearTimer(t[r]);
                var a = o._soundById(t[r]);
                a && (a._seek = a._start || 0, a._rateSeek = 0, a._paused = !0, a._ended = !0, o._stopFade(t[r]), a._node && (o._webAudio ? a._node.bufferSource && (void 0 === a._node.bufferSource.stop ? a._node.bufferSource.noteOff(0) : a._node.bufferSource.stop(0), o._cleanBuffer(a._node)) : isNaN(a._node.duration) && a._node.duration !== 1 / 0 || (a._node.currentTime = a._start || 0, a._node.pause())), n || o._emit("stop", a._id))
            }
            return o
        },
        mute: function (e, o) {
            var t = this;
            if ("loaded" !== t._state) return t._queue.push({
                event: "mute",
                action: function () {
                    t.mute(e, o)
                }
            }), t;
            if (void 0 === o) {
                if ("boolean" != typeof e) return t._muted;
                t._muted = e
            }
            for (var r = t._getSoundIds(o), a = 0; a < r.length; a++) {
                var u = t._soundById(r[a]);
                u && (u._muted = e, t._webAudio && u._node ? u._node.gain.setValueAtTime(e ? 0 : u._volume, n.ctx.currentTime) : u._node && (u._node.muted = !!n._muted || e), t._emit("mute", u._id))
            }
            return t
        },
        volume: function () {
            var e, o, t = this,
                r = arguments;
            if (0 === r.length) return t._volume;
            1 === r.length || 2 === r.length && void 0 === r[1] ? t._getSoundIds().indexOf(r[0]) >= 0 ? o = parseInt(r[0], 10) : e = parseFloat(r[0]) : r.length >= 2 && (e = parseFloat(r[0]), o = parseInt(r[1], 10));
            var a;
            if (!(void 0 !== e && e >= 0 && 1 >= e)) return a = o ? t._soundById(o) : t._sounds[0], a ? a._volume : 0;
            if ("loaded" !== t._state) return t._queue.push({
                event: "volume",
                action: function () {
                    t.volume.apply(t, r)
                }
            }), t;
            void 0 === o && (t._volume = e), o = t._getSoundIds(o);
            for (var u = 0; u < o.length; u++)(a = t._soundById(o[u])) && (a._volume = e, r[2] || t._stopFade(o[u]), t._webAudio && a._node && !a._muted ? a._node.gain.setValueAtTime(e, n.ctx.currentTime) : a._node && !a._muted && (a._node.volume = e * n.volume()), t._emit("volume", a._id));
            return t
        },
        fade: function (e, o, t, r) {
            var a = this;
            if ("loaded" !== a._state) return a._queue.push({
                event: "fade",
                action: function () {
                    a.fade(e, o, t, r)
                }
            }), a;
            a.volume(e, r);
            for (var u = a._getSoundIds(r), i = 0; i < u.length; i++) {
                var d = a._soundById(u[i]);
                if (d) {
                    if (r || a._stopFade(u[i]), a._webAudio && !d._muted) {
                        var _ = n.ctx.currentTime,
                            s = _ + t / 1e3;
                        d._volume = e, d._node.gain.setValueAtTime(e, _), d._node.gain.linearRampToValueAtTime(o, s)
                    }
                    a._startFadeInterval(d, e, o, t, u[i])
                }
            }
            return a
        },
        _startFadeInterval: function (e, n, o, t, r) {
            var a = this,
                u = n,
                i = n > o ? "out" : "in",
                d = Math.abs(n - o),
                _ = d / .01,
                s = _ > 0 ? t / _ : t;
            4 > s && (_ = Math.ceil(_ / (4 / s)), s = 4), e._interval = setInterval(function () {
                _ > 0 && (u += "in" === i ? .01 : -.01), u = Math.max(0, u), u = Math.min(1, u), u = Math.round(100 * u) / 100, a._webAudio ? (void 0 === r && (a._volume = u), e._volume = u) : a.volume(u, e._id, !0), (n > o && o >= u || o > n && u >= o) && (clearInterval(e._interval), e._interval = null, a.volume(o, e._id), a._emit("fade", e._id))
            }, s)
        },
        _stopFade: function (e) {
            var o = this,
                t = o._soundById(e);
            return t && t._interval && (o._webAudio && t._node.gain.cancelScheduledValues(n.ctx.currentTime), clearInterval(t._interval), t._interval = null, o._emit("fade", e)), o
        },
        loop: function () {
            var e, n, o, t = this,
                r = arguments;
            if (0 === r.length) return t._loop;
            if (1 === r.length) {
                if ("boolean" != typeof r[0]) return !!(o = t._soundById(parseInt(r[0], 10))) && o._loop;
                e = r[0], t._loop = e
            } else 2 === r.length && (e = r[0], n = parseInt(r[1], 10));
            for (var a = t._getSoundIds(n), u = 0; u < a.length; u++)(o = t._soundById(a[u])) && (o._loop = e, t._webAudio && o._node && o._node.bufferSource && (o._node.bufferSource.loop = e, e && (o._node.bufferSource.loopStart = o._start || 0, o._node.bufferSource.loopEnd = o._stop)));
            return t
        },
        rate: function () {
            var e, o, t = this,
                r = arguments;
            if (0 === r.length) o = t._sounds[0]._id;
            else if (1 === r.length) {
                var a = t._getSoundIds(),
                    u = a.indexOf(r[0]);
                u >= 0 ? o = parseInt(r[0], 10) : e = parseFloat(r[0])
            } else 2 === r.length && (e = parseFloat(r[0]), o = parseInt(r[1], 10));
            var i;
            if ("number" != typeof e) return i = t._soundById(o), i ? i._rate : t._rate;
            if ("loaded" !== t._state) return t._queue.push({
                event: "rate",
                action: function () {
                    t.rate.apply(t, r)
                }
            }), t;
            void 0 === o && (t._rate = e), o = t._getSoundIds(o);
            for (var d = 0; d < o.length; d++)
                if (i = t._soundById(o[d])) {
                    i._rateSeek = t.seek(o[d]), i._playStart = t._webAudio ? n.ctx.currentTime : i._playStart, i._rate = e, t._webAudio && i._node && i._node.bufferSource ? i._node.bufferSource.playbackRate.value = e : i._node && (i._node.playbackRate = e);
                    var _ = t.seek(o[d]),
                        s = (t._sprite[i._sprite][0] + t._sprite[i._sprite][1]) / 1e3 - _,
                        l = 1e3 * s / Math.abs(i._rate);
                    !t._endTimers[o[d]] && i._paused || (t._clearTimer(o[d]), t._endTimers[o[d]] = setTimeout(t._ended.bind(t, i), l)), t._emit("rate", i._id)
                } return t
        },
        seek: function () {
            var e, o, t = this,
                r = arguments;
            if (0 === r.length) o = t._sounds[0]._id;
            else if (1 === r.length) {
                var a = t._getSoundIds(),
                    u = a.indexOf(r[0]);
                u >= 0 ? o = parseInt(r[0], 10) : t._sounds.length && (o = t._sounds[0]._id, e = parseFloat(r[0]))
            } else 2 === r.length && (e = parseFloat(r[0]), o = parseInt(r[1], 10));
            if (void 0 === o) return t;
            if ("loaded" !== t._state) return t._queue.push({
                event: "seek",
                action: function () {
                    t.seek.apply(t, r)
                }
            }), t;
            var i = t._soundById(o);
            if (i) {
                if (!("number" == typeof e && e >= 0)) {
                    if (t._webAudio) {
                        var d = t.playing(o) ? n.ctx.currentTime - i._playStart : 0,
                            _ = i._rateSeek ? i._rateSeek - i._seek : 0;
                        return i._seek + (_ + d * Math.abs(i._rate))
                    }
                    return i._node.currentTime
                }
                var s = t.playing(o);
                s && t.pause(o, !0), i._seek = e, i._ended = !1, t._clearTimer(o), s && t.play(o, !0), !t._webAudio && i._node && (i._node.currentTime = e), t._emit("seek", o)
            }
            return t
        },
        playing: function (e) {
            var n = this;
            if ("number" == typeof e) {
                var o = n._soundById(e);
                return !!o && !o._paused
            }
            for (var t = 0; t < n._sounds.length; t++)
                if (!n._sounds[t]._paused) return !0;
            return !1
        },
        duration: function (e) {
            var n = this,
                o = n._duration,
                t = n._soundById(e);
            return t && (o = n._sprite[t._sprite][1] / 1e3), o
        },
        state: function () {
            return this._state
        },
        unload: function () {
            for (var e = this, o = e._sounds, t = 0; t < o.length; t++) {
                o[t]._paused || e.stop(o[t]._id), e._webAudio || (/MSIE |Trident\//.test(n._navigator && n._navigator.userAgent) || (o[t]._node.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"), o[t]._node.removeEventListener("error", o[t]._errorFn, !1), o[t]._node.removeEventListener(n._canPlayEvent, o[t]._loadFn, !1)), delete o[t]._node, e._clearTimer(o[t]._id);
                var a = n._howls.indexOf(e);
                a >= 0 && n._howls.splice(a, 1)
            }
            var u = !0;
            for (t = 0; t < n._howls.length; t++)
                if (n._howls[t]._src === e._src) {
                    u = !1;
                    break
                } return r && u && delete r[e._src], n.noAudio = !1, e._state = "unloaded", e._sounds = [], e = null, null
        },
        on: function (e, n, o, t) {
            var r = this,
                a = r["_on" + e];
            return "function" == typeof n && a.push(t ? {
                id: o,
                fn: n,
                once: t
            } : {
                id: o,
                fn: n
            }), r
        },
        off: function (e, n, o) {
            var t = this,
                r = t["_on" + e],
                a = 0;
            if ("number" == typeof n && (o = n, n = null), n || o)
                for (a = 0; a < r.length; a++) {
                    var u = o === r[a].id;
                    if (n === r[a].fn && u || !n && u) {
                        r.splice(a, 1);
                        break
                    }
                } else if (e) t["_on" + e] = [];
                else {
                    var i = Object.keys(t);
                    for (a = 0; a < i.length; a++) 0 === i[a].indexOf("_on") && Array.isArray(t[i[a]]) && (t[i[a]] = [])
                } return t
        },
        once: function (e, n, o) {
            var t = this;
            return t.on(e, n, o, 1), t
        },
        _emit: function (e, n, o) {
            for (var t = this, r = t["_on" + e], a = r.length - 1; a >= 0; a--) r[a].id && r[a].id !== n && "load" !== e || (setTimeout(function (e) {
                e.call(this, n, o)
            }.bind(t, r[a].fn), 0), r[a].once && t.off(e, r[a].fn, r[a].id));
            return t
        },
        _loadQueue: function () {
            var e = this;
            if (e._queue.length > 0) {
                var n = e._queue[0];
                e.once(n.event, function () {
                    e._queue.shift(), e._loadQueue()
                }), n.action()
            }
            return e
        },
        _ended: function (e) {
            var o = this,
                t = e._sprite;
            if (!o._webAudio && e._node && !e._node.paused) return setTimeout(o._ended.bind(o, e), 100), o;
            var r = !(!e._loop && !o._sprite[t][2]);
            if (o._emit("end", e._id), !o._webAudio && r && o.stop(e._id, !0).play(e._id), o._webAudio && r) {
                o._emit("play", e._id), e._seek = e._start || 0, e._rateSeek = 0, e._playStart = n.ctx.currentTime;
                var a = 1e3 * (e._stop - e._start) / Math.abs(e._rate);
                o._endTimers[e._id] = setTimeout(o._ended.bind(o, e), a)
            }
            return o._webAudio && !r && (e._paused = !0, e._ended = !0, e._seek = e._start || 0, e._rateSeek = 0, o._clearTimer(e._id), o._cleanBuffer(e._node), n._autoSuspend()), o._webAudio || r || o.stop(e._id), o
        },
        _clearTimer: function (e) {
            var n = this;
            return n._endTimers[e] && (clearTimeout(n._endTimers[e]), delete n._endTimers[e]), n
        },
        _soundById: function (e) {
            for (var n = this, o = 0; o < n._sounds.length; o++)
                if (e === n._sounds[o]._id) return n._sounds[o];
            return null
        },
        _inactiveSound: function () {
            var e = this;
            e._drain();
            for (var n = 0; n < e._sounds.length; n++)
                if (e._sounds[n]._ended) return e._sounds[n].reset();
            return new t(e)
        },
        _drain: function () {
            var e = this,
                n = e._pool,
                o = 0,
                t = 0;
            if (!(e._sounds.length < n)) {
                for (t = 0; t < e._sounds.length; t++) e._sounds[t]._ended && o++;
                for (t = e._sounds.length - 1; t >= 0; t--) {
                    if (n >= o) return;
                    e._sounds[t]._ended && (e._webAudio && e._sounds[t]._node && e._sounds[t]._node.disconnect(0), e._sounds.splice(t, 1), o--)
                }
            }
        },
        _getSoundIds: function (e) {
            var n = this;
            if (void 0 === e) {
                for (var o = [], t = 0; t < n._sounds.length; t++) o.push(n._sounds[t]._id);
                return o
            }
            return [e]
        },
        _refreshBuffer: function (e) {
            var o = this;
            return e._node.bufferSource = n.ctx.createBufferSource(), e._node.bufferSource.buffer = r[o._src], e._panner ? e._node.bufferSource.connect(e._panner) : e._node.bufferSource.connect(e._node), e._node.bufferSource.loop = e._loop, e._loop && (e._node.bufferSource.loopStart = e._start || 0, e._node.bufferSource.loopEnd = e._stop), e._node.bufferSource.playbackRate.value = e._rate, o
        },
        _cleanBuffer: function (e) {
            var n = this;
            if (n._scratchBuffer) {
                e.bufferSource.onended = null, e.bufferSource.disconnect(0);
                try {
                    e.bufferSource.buffer = n._scratchBuffer
                } catch (e) {}
            }
            return e.bufferSource = null, n
        }
    };
    var t = function (e) {
        this._parent = e, this.init()
    };
    t.prototype = {
        init: function () {
            var e = this,
                o = e._parent;
            return e._muted = o._muted, e._loop = o._loop, e._volume = o._volume, e._rate = o._rate, e._seek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = ++n._counter, o._sounds.push(e), e.create(), e
        },
        create: function () {
            var e = this,
                o = e._parent,
                t = n._muted || e._muted || e._parent._muted ? 0 : e._volume;
            return o._webAudio ? (e._node = void 0 === n.ctx.createGain ? n.ctx.createGainNode() : n.ctx.createGain(), e._node.gain.setValueAtTime(t, n.ctx.currentTime), e._node.paused = !0, e._node.connect(n.masterGain)) : (e._node = new Audio, e._errorFn = e._errorListener.bind(e), e._node.addEventListener("error", e._errorFn, !1), e._loadFn = e._loadListener.bind(e), e._node.addEventListener(n._canPlayEvent, e._loadFn, !1), e._node.src = o._src, e._node.preload = "auto", e._node.volume = t * n.volume(), e._node.load()), e
        },
        reset: function () {
            var e = this,
                o = e._parent;
            return e._muted = o._muted, e._loop = o._loop, e._volume = o._volume, e._rate = o._rate, e._seek = 0, e._rateSeek = 0, e._paused = !0, e._ended = !0, e._sprite = "__default", e._id = ++n._counter, e
        },
        _errorListener: function () {
            var e = this;
            e._parent._emit("loaderror", e._id, e._node.error ? e._node.error.code : 0), e._node.removeEventListener("error", e._errorFn, !1)
        },
        _loadListener: function () {
            var e = this,
                o = e._parent;
            o._duration = Math.ceil(10 * e._node.duration) / 10, 0 === Object.keys(o._sprite).length && (o._sprite = {
                __default: [0, 1e3 * o._duration]
            }), "loaded" !== o._state && (o._state = "loaded", o._emit("load"), o._loadQueue()), e._node.removeEventListener(n._canPlayEvent, e._loadFn, !1)
        }
    };
    var r = {},
        a = function (e) {
            var n = e._src;
            if (r[n]) return e._duration = r[n].duration, void d(e);
            if (/^data:[^;]+;base64,/.test(n)) {
                for (var o = atob(n.split(",")[1]), t = new Uint8Array(o.length), a = 0; a < o.length; ++a) t[a] = o.charCodeAt(a);
                i(t.buffer, e)
            } else {
                var _ = new XMLHttpRequest;
                _.open("GET", n, !0), _.withCredentials = e._xhrWithCredentials, _.responseType = "arraybuffer", _.onload = function () {
                    var n = (_.status + "")[0];
                    return "0" !== n && "2" !== n && "3" !== n ? void e._emit("loaderror", null, "Failed loading audio file with status: " + _.status + ".") : void i(_.response, e)
                }, _.onerror = function () {
                    e._webAudio && (e._html5 = !0, e._webAudio = !1, e._sounds = [], delete r[n], e.load())
                }, u(_)
            }
        },
        u = function (e) {
            try {
                e.send()
            } catch (n) {
                e.onerror()
            }
        },
        i = function (e, o) {
            n.ctx.decodeAudioData(e, function (e) {
                e && o._sounds.length > 0 && (r[o._src] = e, d(o, e))
            }, function () {
                o._emit("loaderror", null, "Decoding audio data failed.")
            })
        },
        d = function (e, n) {
            n && !e._duration && (e._duration = n.duration), 0 === Object.keys(e._sprite).length && (e._sprite = {
                __default: [0, 1e3 * e._duration]
            }), "loaded" !== e._state && (e._state = "loaded", e._emit("load"), e._loadQueue())
        },
        _ = function () {
            try {
                "undefined" != typeof AudioContext ? n.ctx = new AudioContext : "undefined" != typeof webkitAudioContext ? n.ctx = new webkitAudioContext : n.usingWebAudio = !1
            } catch (e) {
                n.usingWebAudio = !1
            }
            var e = /iP(hone|od|ad)/.test(n._navigator && n._navigator.platform),
                o = n._navigator && n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),
                t = o ? parseInt(o[1], 10) : null;
            if (e && t && 9 > t) {
                var r = /safari/.test(n._navigator && n._navigator.userAgent.toLowerCase());
                (n._navigator && n._navigator.standalone && !r || n._navigator && !n._navigator.standalone && !r) && (n.usingWebAudio = !1)
            }
            n.usingWebAudio && (n.masterGain = void 0 === n.ctx.createGain ? n.ctx.createGainNode() : n.ctx.createGain(), n.masterGain.gain.value = n._muted ? 0 : 1, n.masterGain.connect(n.ctx.destination)), n._setup()
        };
    "function" == typeof define && define.amd && define([], function () {
        return {
            Howler: n,
            Howl: o
        }
    }), "undefined" != typeof exports && (exports.Howler = n, exports.Howl = o), "undefined" != typeof window ? (window.HowlerGlobal = e, window.Howler = n, window.Howl = o, window.Sound = t) : "undefined" != typeof global && (global.HowlerGlobal = e, global.Howler = n, global.Howl = o, global.Sound = t)
}(),
function () {
    function isNotesMarked() {
        collectAllNotes[0] && (Object.values(collectAllNotes[0]).length >= 1 ? ($(".btn-reset").removeClass("hidden"), $(".playAll").removeClass("hidden")) : ($(".btn-reset").addClass("hidden"), $(".playAll").addClass("hidden")))
    }

    function markNotes(key) {
        if (!markTrigger) {
            var currentKey = key.attr("data-note");
            lockEvent[currentKey] || key.toggleClass("marked").promise().done(function () {
                collectAllNotes.length > 0 && (tempObjNote = collectAllNotes[0]), $(this).hasClass("marked") ? (tempObjNote[currentKey] = currentKey, collectAllNotes[0] = tempObjNote, collectNotesToArr = Object.values(tempObjNote)) : (delete collectAllNotes[0][currentKey], collectNotesToArr = Object.values(tempObjNote))
            })
        }
        updateURL()
    }

    function stopLastAudio() {
        function callback() {
            setTimeout(function () {
                Howler.volume(1)
            }, 20)
        }
        if (lastPlaying) {
            var lockEventArr = Object.keys(lockEvent).map(function (key) {
                    return lockEvent[key]
                }),
                lockEv = lockEventArr.filter(function (word) {
                    return word
                });
            if (Howler._volume < 1 && 0 === lockEv.length) {
                var counterLastAudio = 0;
                lastAudioArr.forEach(function (key, index, array) {
                    key.fade(1, 0, 10, lastPlayingArr[index]), counterLastAudio++, counterLastAudio === array.length && callback()
                })
            }
            0 === lockEv.length && (lastAudioArr.forEach(function (key, index) {
                key.fade(1, 0, 10, lastPlayingArr[index])
            }), lastAudioArr = [], lastPlayingArr = [])
        }
    }

    function soundReduction() {
        lastAudioArr.length >= 2 && Howler.volume(.8)
    }

    function playOnClick() {
        $(".key > span").on("mousedown touchstart", function (e) {
            e.stopPropagation();
            var key = $(this),
                noteClick = key.attr("data-note");
            lastPlaying = notes[noteClick].play(), new Date - counter > 150 && stopLastAudio(), key.addClass("active"), lastAudioArr.push(notes[noteClick]), lastPlayingArr.push(lastPlaying), counter = new Date, markTrigger || markNotes(key)
        }).on("mouseup touchend", function (e) {
            e.cancelable && e.preventDefault();
            var key = $(this);
            setTimeout(function () {
                key.removeClass("active"), isNotesMarked()
            }, 100)
        }).on("mouseout touchmove", function () {
            lockEventMarkedPlay ? "" : $(this).removeClass("active")
        })
    }
    function splayOnClick() {
        $("[data-snote]").on("mousedown touchstart", function (e) {
            e.stopPropagation();
            var key = $(this),
                noteClick = key.attr("data-snote");
            lastPlaying = notes[noteClick].play(), new Date - counter > 150 && stopLastAudio(), key.addClass("active"), lastAudioArr.push(notes[noteClick]), lastPlayingArr.push(lastPlaying), counter = new Date, markTrigger || markNotes(key)
        }).on("mouseup touchend", function (e) {
            e.cancelable && e.preventDefault();
            var key = $(this);
            setTimeout(function () {
                key.removeClass("active"), isNotesMarked()
            }, 100)
        }).on("mouseout touchmove", function () {
            lockEventMarkedPlay ? "" : $(this).removeClass("active")
        })
    }

    function markKeys() {
        $(this).toggleClass("active"), markTrigger = !markTrigger
    }

    function clearMarked() {
        var allMarked = document.querySelectorAll(".marked");
        allMarked.forEach(function (key) {
            key.classList.remove("marked")
        }), collectAllNotes = [], collectNotesToArr = [], tempObjNote = {}, clearUrl(), $(this).addClass("hidden"), $(".playAll").addClass("hidden")
    }

    function playMarkedNotes() {
        var allMarkedNotes = document.querySelectorAll(".marked > span"),
            isActiveMarkedNotes = [];
        allMarkedNotes.length >= 2 ? Howler.volume(.8) : Howler.volume(1), allMarkedNotes.forEach(function (key) {
            var markedNote = notes[key.parentNode.dataset.note],
                $key = $('[data-note="' + key.parentNode.dataset.note + '"]');
            isActiveMarkedNotes.push($key), lastPlaying = markedNote.play(), $key.addClass("active"), lockEventMarkedPlay = !0, lastAudioArr.push(markedNote), lastPlayingArr.push(lastPlaying), setTimeout(function () {
                isActiveMarkedNotes.forEach(function (note) {
                    note.removeClass("active")
                }), lockEventMarkedPlay = !1
            }, 200)
        })
    }

    function hideNotes() {
        var button = document.querySelector(".hideNotes");
        button.innerText = button.innerText == buttonNames.showHideNotes.show ? buttonNames.showHideNotes.hide : buttonNames.showHideNotes.show;
        var allNotes = document.querySelectorAll(".key .note");
        allNotes.forEach(function (note) {
            note.classList.toggle("hide-notes")
        })
    }

    function hideSettings() {
        var button = document.querySelector(".hideSettings");
        button.innerText = button.innerText == buttonNames.showHideSettings.show ? buttonNames.showHideSettings.hide : buttonNames.showHideSettings.show;
        $("#keyTablesWrapper").toggle("hidden");
    }

    function parseURLParams(url) {
        var i, n, v, nv, queryStart = url.indexOf("?") + 1,
            queryEnd = url.indexOf("#") + 1 || url.length + 1,
            query = url.slice(queryStart, queryEnd - 1),
            pairs = query.replace(/\+/g, " ").split("&"),
            parameters = {},
            elements = [];
        if (query !== url && "" !== query) {
            for (i = 0; i < pairs.length; i++) nv = pairs[i].split("=", 2), n = decodeURIComponent(nv[0]), v = decodeURIComponent(nv[1]), parameters.hasOwnProperty(n) || (parameters[n] = []), parameters[n].push(2 === nv.length ? v : null), elements.push(n);
            return elements
        }
    }

    function clearUrl() {
        $.ajax({
            url: pianoURL.substring(0, pianoURL.length - 1),
            type: "GET",
            success: function () {
                window.history.pushState("", "", this.url + "")
            },
            error: function () {
                console.log("There was a problem with the request.")
            }
        })
    }

    function updateURL() {
        var arrayOfNotes = collectNotesToArr.join(".");
        $.ajax({
            url: pianoURL + arrayOfNotes,
            type: "GET",
            success: function () {
                window.history.pushState("", "", this.url + "")
            },
            error: function () {
                console.log("There was a problem with the request.")
            }
        })
    }

    function parseUrl() {
        var currUrl = parseURLParams(window.location.href),
            currObj = currUrl[0].split("."),
            objForArr = {};
        currObj.length > 0 && "" != currObj && currObj.forEach(function (item) {
            var note = document.querySelector("[data-note='" + item + "']"),
                dataNote = note.dataset.note;
            note.classList.add("marked"), objForArr[dataNote] = dataNote
        }), collectAllNotes[0] = objForArr, isNotesMarked()
    }

    function codeAddress() {
        void 0 !== parseURLParams(window.location.href) && parseUrl()
    }

    function backButtonFunctionalityURL() {
        window.location.href = document.referrer
    }

    var buttonNames = {
        markNotes: "Mark",
        showHideNotes: {
          show: "Show note keys",
          hide: "Hide note keys",
        },
        showHideSettings: {
            show: "Show note settings",
            hide: "Hide note settings",
          },
        playNotes: "Play",
        reset: "Clear",
      };
    $(".mark").text(buttonNames.markNotes), $(".playAll").text(buttonNames.playNotes), $(".btn-reset").text(buttonNames.reset), $(".hideNotes").text(buttonNames.showHideNotes.hide), $(".hideSettings").text(buttonNames.showHideSettings.hide);
    //var keyNames = PIANO_TRANSLATION.noteNames;
    var notes = {};
    var keyCharBank = {};
    /*console.log("1 "+"1".charCodeAt(0));
    console.log("9 "+"9".charCodeAt(0));
    console.log("0 "+"0".charCodeAt(0));
    console.log("A "+"A".charCodeAt(0));
    console.log("Z "+"Z".charCodeAt(0));
    console.log("a "+"a".charCodeAt(0));
    console.log("z "+"z".charCodeAt(0));
    console.log("- "+"-".charCodeAt(0));
    console.log("+ "+"+".charCodeAt(0));*/

    var keyTable = "";
    var keyTableCis = "";
    $("[data-note]").each(function () {
        //var noteHTML = $(this)[0].dataset.note.slice(1);
        //$(this).html("<i></i><span class='note'>" + keyNames[noteHTML] + "</span>")
        $(this).html("<i></i><span class='note' id='note_"+$(this)[0].dataset.note+"'>" + String.fromCharCode($(this)[0].dataset.key) + "</span>")
        
        let ht = "<select class='select_key' note='"+$(this)[0].dataset.note+"'><option value=''>--</option>";
        for (let i = 40; i<= 90; i++){
            selected = ($(this)[0].dataset.key == i)? 'selected="selected"' : '';
            ht += '<option '+selected+' value="'+i+'">'+String.fromCharCode(i)+'</option>';
        }
        ht += "</select>";

        res ="<tr><td>"+$(this)[0].dataset.note+"</td><td>"+ht+"</td></tr>";
        if($(this)[0].dataset.note.length==2){
            keyTable+=res;
        }else{
            keyTableCis+=res;
        }

        notes[$(this)[0].dataset.note] = new Howl({
            src: ["./mp3/guitar/"+$(this)[0].dataset.note.replace("is", "x")+".mp3"]
        });
        keyCharBank[$(this)[0].dataset.note] = [$(this)[0].dataset.key];
    });
    if($("#square")[0]){
        var snotes = ["c", "cis", "d", "dis", "e", "f", "fis", "g", "gis", "a", "ais", "b"];

        for (let i = 3; i< 7; i++){
            for (let j in snotes){
                let note = i+snotes[j];
                notes[note] = new Howl({
                    src: ["./mp3/guitar/"+note.replace("is", "x")+".mp3"]
                });
            }
        }

        $("[data-snote]").each(function () {
            let ht = "<select class='hidden select_note'><option value=''>--</option>";
            for (let i = 3; i< 7; i++){
                for (let j in snotes){
                    let note = i+snotes[j];
                    selected = ($(this)[0].dataset.snote == note)? 'selected="selected"' : '';
                    ht += '<option '+selected+' value="'+note+'">'+note+'</option>';
                }
            }
            ht += "</select>";
            $(this).parent().find(".select-wrapper").html(ht);

        });
        $("#show_hide_list").on("click", function (e) {
            e.stopPropagation();
            $('.select_note').toggleClass("hidden");
            $('#select_picture').toggleClass("hidden");
        });
    }
    $( document ).ready(function() {
        $("#keyTableWrapper").html(keyTable);
        $("#keyTableCisWrapper").html(keyTableCis);
        $('.select_key').each(function (el) {
            $(this).on("change", function () {
                var note = this.getAttribute("note");
                this.parentNode.dataset.key=this.value;
                keyCharBank[note]=[this.value];
                keys[this.value] = note;

                $("#note_"+note).text(String.fromCharCode(this.value));
            });
        });
        $('.select_note').each(function (el) {
            $(this).on("change", function () {
                let elem = $(this.parentNode.parentNode).find(".data-snote")[0];
                if(!elem.dataset.snoteInitial){
                    elem.dataset.snoteInitial = elem.dataset.snote;
                }
                elem.dataset.snote=this.value;
            });
        });
      });

    for (notes, lockEvent = {}, i = 0; 256 > i; i++) lockEvent[i] = !1;
    var lastPlaying, counter, lastAudioArr = [],
        lastPlayingArr = [],
        //keyCharBank = PIANO_TRANSLATION.keys,
        keys = {};
    $.map(keyCharBank, function (v, i) {
        v.forEach(function (element) {
            keys[element] = i
        })
    });
    var spacebarPressed = !1;
    $(window).bind("keydown keyup", function (ev) {
        var keyNo = ev.which;
        52 === keyNo && ev.preventDefault();
        var $key = $('[data-note="' + keys[ev.which] + '"]'),
            note = notes[keys[ev.which]];

        "keydown" == ev.type && note ? lockEvent[keyNo] || (lastPlaying = note.play(), new Date - counter > 100 ? stopLastAudio() : soundReduction(), counter = new Date, lastAudioArr.push(note), lastPlayingArr.push(lastPlaying), lockEvent[keyNo] = !0, $key.addClass("active"), $key.parent().addClass("active"), markTrigger || markNotes($key)) : "keyup" == ev.type && (lockEvent[keyNo] = !1, $key.removeClass("active"), $key.parent().removeClass("active"), isNotesMarked()), "keydown" == ev.type && 32 === ev.keyCode ? (ev.preventDefault(), spacebarPressed || (playMarkedNotes(), spacebarPressed = !0)) : "keyup" == ev.type && 32 === ev.keyCode && (spacebarPressed = !1)
    });
    var markTrigger = !0,
        collectAllNotes = [],
        collectNotesToArr = [],
        tempObjNote = {},
        lockEventMarkedPlay = !1,
        markBtn = document.querySelector(".mark"),
        clearBtn = document.querySelector(".clear"),
        playAll = document.querySelector(".playAll");
    
    if(markBtn){
        markBtn.addEventListener("click", markKeys), 
        clearBtn.addEventListener("click", clearMarked), 
        playAll.addEventListener("click", playMarkedNotes), 
        document.querySelector(".hideNotes").addEventListener("click", hideNotes), 
        document.querySelector(".hideSettings").addEventListener("click", hideSettings), playOnClick(true);

        var pianoURL = "piano?"; //PIANO_TRANSLATION.url;
        window.onload = codeAddress, window.addEventListener("popstate", backButtonFunctionalityURL, !1)
    }else{
        splayOnClick(false);
    }

}();