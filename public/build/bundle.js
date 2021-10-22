
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Rating.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/Rating.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (29:2) {#each Array(5) as _, index}
    function create_each_block(ctx) {
    	let svg;
    	let use0;
    	let use0_mask_value;
    	let use1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			use0 = svg_element("use");
    			use1 = svg_element("use");
    			xlink_attr(use0, "xlink:href", "#star");

    			attr_dev(use0, "mask", use0_mask_value = /*rating*/ ctx[0] < /*index*/ ctx[6] + 1 && /*rating*/ ctx[0] > /*index*/ ctx[6]
    			? 'url(#half)'
    			: '');

    			add_location(use0, file$1, 30, 4, 1771);
    			xlink_attr(use1, "xlink:href", "#star");
    			attr_dev(use1, "fill", "none");
    			attr_dev(use1, "stroke", "#0097A7");
    			attr_dev(use1, "stroke-width", "1");
    			add_location(use1, file$1, 32, 4, 1876);
    			attr_dev(svg, "class", "" + (null_to_empty(/*generateStarClass*/ ctx[2](/*index*/ ctx[6] + 1)) + " svelte-8fro78"));
    			attr_dev(svg, "width", "16");
    			attr_dev(svg, "height", "15");
    			attr_dev(svg, "viewBox", "0 0 16 15");
    			add_location(svg, file$1, 29, 4, 1682);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, use0);
    			append_dev(svg, use1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*rating*/ 1 && use0_mask_value !== (use0_mask_value = /*rating*/ ctx[0] < /*index*/ ctx[6] + 1 && /*rating*/ ctx[0] > /*index*/ ctx[6]
    			? 'url(#half)'
    			: '')) {
    				attr_dev(use0, "mask", use0_mask_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(29:2) {#each Array(5) as _, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let svg;
    	let defs;
    	let mask;
    	let rect0;
    	let rect1;
    	let rect1_x_value;
    	let symbol;
    	let path;
    	let t;
    	let div1;
    	let each_value = Array(5);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			mask = svg_element("mask");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			symbol = svg_element("symbol");
    			path = svg_element("path");
    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(rect0, "x", "0");
    			attr_dev(rect0, "y", "0");
    			attr_dev(rect0, "width", "16");
    			attr_dev(rect0, "height", "15");
    			attr_dev(rect0, "fill", "white");
    			add_location(rect0, file$1, 18, 8, 536);
    			attr_dev(rect1, "x", rect1_x_value = "" + (/*decimalPart*/ ctx[1] + "%"));
    			attr_dev(rect1, "y", "0");
    			attr_dev(rect1, "width", "16");
    			attr_dev(rect1, "height", "15");
    			attr_dev(rect1, "fill", "black");
    			add_location(rect1, file$1, 19, 8, 601);
    			attr_dev(mask, "id", "half");
    			add_location(mask, file$1, 17, 6, 511);
    			attr_dev(path, "d", "M14.9613 5.20694L10.4983 4.55831L8.50314 0.513581C8.44864 0.402839 8.35899 0.31319 8.24825 0.258698C7.97052 0.121589 7.63302 0.235846 7.49415 0.513581L5.49903 4.55831L1.03595 5.20694C0.912902 5.22452 0.800402 5.28253 0.714269 5.37042C0.61014 5.47744 0.552759 5.62143 0.554737 5.77074C0.556715 5.92006 0.617888 6.06247 0.724816 6.16671L3.95392 9.31495L3.19103 13.7605C3.17314 13.8639 3.18458 13.9702 3.22406 14.0675C3.26354 14.1647 3.32947 14.2489 3.41439 14.3106C3.4993 14.3723 3.5998 14.4089 3.70448 14.4164C3.80917 14.4239 3.91385 14.4018 4.00665 14.3528L7.99864 12.254L11.9906 14.3528C12.0996 14.4108 12.2262 14.4302 12.3475 14.4091C12.6533 14.3564 12.859 14.0663 12.8063 13.7605L12.0434 9.31495L15.2725 6.16671C15.3604 6.08057 15.4184 5.96807 15.4359 5.84503C15.4834 5.53741 15.269 5.25264 14.9613 5.20694Z");
    			add_location(path, file$1, 22, 8, 773);
    			attr_dev(symbol, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(symbol, "viewBox", "0 0 16 15");
    			attr_dev(symbol, "id", "star");
    			add_location(symbol, file$1, 21, 6, 691);
    			add_location(defs, file$1, 16, 4, 498);
    			set_style(svg, "width", "16");
    			set_style(svg, "height", "15");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 16 15");
    			add_location(svg, file$1, 15, 2, 402);
    			add_location(div0, file$1, 14, 0, 394);
    			add_location(div1, file$1, 27, 0, 1641);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, svg);
    			append_dev(svg, defs);
    			append_dev(defs, mask);
    			append_dev(mask, rect0);
    			append_dev(mask, rect1);
    			append_dev(defs, symbol);
    			append_dev(symbol, path);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*decimalPart*/ 2 && rect1_x_value !== (rect1_x_value = "" + (/*decimalPart*/ ctx[1] + "%"))) {
    				attr_dev(rect1, "x", rect1_x_value);
    			}

    			if (dirty & /*generateStarClass, rating*/ 5) {
    				each_value = Array(5);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Rating', slots, []);
    	let { rating = 0 } = $$props;
    	let decimalPart = 0;
    	let roundedRating = Math.floor(rating);

    	function generateStarClass(starNumber) {
    		return `c-star ${rating === starNumber || rating > starNumber - 1
		? 'active'
		: ''}`;
    	}

    	const writable_props = ['rating'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Rating> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('rating' in $$props) $$invalidate(0, rating = $$props.rating);
    	};

    	$$self.$capture_state = () => ({
    		rating,
    		decimalPart,
    		roundedRating,
    		generateStarClass
    	});

    	$$self.$inject_state = $$props => {
    		if ('rating' in $$props) $$invalidate(0, rating = $$props.rating);
    		if ('decimalPart' in $$props) $$invalidate(1, decimalPart = $$props.decimalPart);
    		if ('roundedRating' in $$props) $$invalidate(3, roundedRating = $$props.roundedRating);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*rating, decimalPart*/ 3) {
    			{
    				console.log(`the rating is ${rating}`);
    				$$invalidate(1, decimalPart = (rating - roundedRating) * 100);
    				console.log(decimalPart, roundedRating);
    			}
    		}
    	};

    	return [rating, decimalPart, generateStarClass];
    }

    class Rating extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { rating: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rating",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get rating() {
    		throw new Error("<Rating>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rating(value) {
    		throw new Error("<Rating>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let input;
    	let t;
    	let rating_1;
    	let current;
    	let mounted;
    	let dispose;

    	rating_1 = new Rating({
    			props: { rating: /*rating*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			input = element("input");
    			t = space();
    			create_component(rating_1.$$.fragment);
    			attr_dev(input, "type", "text");
    			input.disabled = true;
    			add_location(input, file, 7, 1, 100);
    			add_location(main, file, 6, 0, 92);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, input);
    			set_input_value(input, /*rating*/ ctx[0]);
    			append_dev(main, t);
    			mount_component(rating_1, main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[1]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rating*/ 1 && input.value !== /*rating*/ ctx[0]) {
    				set_input_value(input, /*rating*/ ctx[0]);
    			}

    			const rating_1_changes = {};
    			if (dirty & /*rating*/ 1) rating_1_changes.rating = /*rating*/ ctx[0];
    			rating_1.$set(rating_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rating_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rating_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(rating_1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let rating = 3.40;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		rating = this.value;
    		$$invalidate(0, rating);
    	}

    	$$self.$capture_state = () => ({ Rating, rating });

    	$$self.$inject_state = $$props => {
    		if ('rating' in $$props) $$invalidate(0, rating = $$props.rating);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rating, input_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
