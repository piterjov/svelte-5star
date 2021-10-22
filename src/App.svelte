<script>
  import Rating from './components/Rating.svelte'
  let rating = 3.40;

</script>

<main>
 <input type="text" disabled bind:value={rating} />
 <Rating rating={rating} />
</main>
